# Compiled Win32 Z-order & per-monitor occlusion watcher for Halo.
# Stdin commands:
#   pid:<int>
#   config:<bottom|top>|<watchFs:0|1>|<watchMax:0|1>|<displayId=hwnd=cx=cy,...>
#   nudge
# Stdout events:
#   occ:{"fs":[...],"max":[...]}
$ErrorActionPreference = 'Continue'
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

Add-Type -TypeDefinition @'
using System;
using System.Collections.Generic;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading;

public static class HaloWin {
    [StructLayout(LayoutKind.Sequential)]
    public struct RECT {
        public int Left;
        public int Top;
        public int Right;
        public int Bottom;
    }

    [StructLayout(LayoutKind.Sequential)]
    public struct POINT {
        public int X;
        public int Y;
    }

    [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Auto)]
    public struct MONITORINFO {
        public int cbSize;
        public RECT rcMonitor;
        public RECT rcWork;
        public uint dwFlags;
    }

    private delegate bool EnumWindowsProc(IntPtr hWnd, IntPtr lParam);

    [DllImport("user32.dll")]
    private static extern bool SetWindowPos(IntPtr hWnd, IntPtr hWndInsertAfter, int X, int Y, int cx, int cy, uint uFlags);

    [DllImport("user32.dll")]
    private static extern bool IsWindowVisible(IntPtr hWnd);

    [DllImport("user32.dll")]
    private static extern bool IsIconic(IntPtr hWnd);

    [DllImport("user32.dll")]
    private static extern bool IsZoomed(IntPtr hWnd);

    [DllImport("user32.dll")]
    private static extern IntPtr GetWindow(IntPtr hWnd, uint uCmd);

    [DllImport("user32.dll")]
    private static extern int GetWindowLong(IntPtr hWnd, int nIndex);

    [DllImport("user32.dll")]
    private static extern bool GetWindowRect(IntPtr hWnd, out RECT lpRect);

    [DllImport("user32.dll", CharSet = CharSet.Unicode)]
    private static extern int GetClassName(IntPtr hWnd, StringBuilder lpClassName, int nMaxCount);

    [DllImport("user32.dll", CharSet = CharSet.Unicode)]
    private static extern IntPtr FindWindowEx(IntPtr hwndParent, IntPtr hwndChildAfter, string lpszClass, string lpszWindow);

    [DllImport("user32.dll")]
    private static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint lpdwProcessId);

    [DllImport("user32.dll")]
    private static extern IntPtr GetForegroundWindow();

    [DllImport("user32.dll")]
    private static extern bool EnumWindows(EnumWindowsProc lpEnumFunc, IntPtr lParam);

    [DllImport("user32.dll")]
    private static extern IntPtr MonitorFromWindow(IntPtr hwnd, uint dwFlags);

    [DllImport("user32.dll")]
    private static extern IntPtr MonitorFromPoint(POINT pt, uint dwFlags);

    [DllImport("user32.dll", CharSet = CharSet.Auto)]
    private static extern bool GetMonitorInfo(IntPtr hMonitor, ref MONITORINFO lpmi);

    [DllImport("user32.dll")]
    private static extern bool GetLayeredWindowAttributes(IntPtr hwnd, out uint pcrKey, out byte pbAlpha, out uint pdwFlags);

    [DllImport("dwmapi.dll")]
    private static extern int DwmGetWindowAttribute(IntPtr hwnd, int dwAttribute, out RECT pvAttribute, int cbAttribute);

    [DllImport("dwmapi.dll")]
    private static extern int DwmGetWindowAttribute(IntPtr hwnd, int dwAttribute, out int pvAttribute, int cbAttribute);

    [DllImport("shell32.dll")]
    private static extern int SHQueryUserNotificationState(out int pquns);

    private static readonly IntPtr HWND_BOTTOM = new IntPtr(1);
    private static readonly IntPtr HWND_TOPMOST = new IntPtr(-1);

    private const uint SWP_FLAGS = 0x0013; // SWP_NOSIZE | SWP_NOMOVE | SWP_NOACTIVATE (never SWP_SHOWWINDOW)
    private const uint GW_HWNDNEXT = 2;
    private const int GWL_STYLE = -16;
    private const int GWL_EXSTYLE = -20;

    private const int WS_CAPTION = 0x00C00000;
    private const int WS_THICKFRAME = 0x00040000;
    private const int WS_EX_TRANSPARENT = 0x00000020;
    private const int WS_EX_TOOLWINDOW = 0x00000080;
    private const int WS_EX_LAYERED = 0x00080000;
    private const int WS_EX_NOACTIVATE = 0x08000000;

    private const uint LWA_ALPHA = 0x00000002;
    private const uint MONITOR_DEFAULTTOPRIMARY = 1;
    private const uint MONITOR_DEFAULTTONEAREST = 2;
    private const int DWMWA_EXTENDED_FRAME_BOUNDS = 9;
    private const int DWMWA_CLOAKED = 14;
    private const int QUNS_RUNNING_D3D_FULL_SCREEN = 3;
    private const int QUNS_PRESENTATION_MODE = 4;

    private static readonly HashSet<string> ShellClasses = new HashSet<string>(StringComparer.Ordinal) {
        "WorkerW",
        "Shell_TrayWnd",
        "Shell_SecondaryTrayWnd",
        "Windows.UI.Core.CoreWindow",
        "NotifyIconOverflowWindow",
        "TopLevelWindowForOverflowXamlIsland",
        "MultitaskingViewFrame",
        "TaskListThumbnailWnd",
        "ForegroundStaging",
        "EdgeUiInputTopWndClass",
        "EdgeUiInputWndClass",
        "NativeHWNDHost",
        "SysShadow",
        "Xaml_WindowedPopupClass"
    };

    private sealed class OverlayEntry {
        public long DisplayId;
        public IntPtr Hwnd;
        public int CenterX;
        public int CenterY;
    }

    private sealed class MonitorTarget {
        public long DisplayId;
        public IntPtr Monitor;
        public RECT RcMonitor;
        public RECT RcWork;
        public bool IsFs;
        public bool IsMax;
    }

    private static readonly object _lock = new object();
    private static readonly AutoResetEvent _wake = new AutoResetEvent(false);
    private static volatile bool _eof = false;

    private static uint _haloPid = 0;
    private static string _mode = "bottom";
    private static bool _watchFs = false;
    private static bool _watchMax = false;
    private static List<OverlayEntry> _entries = new List<OverlayEntry>();
    private static bool _nudgeZ = false;
    private static bool _forceOccEmit = false;
    private static string _lastOccJson = "";

    private static void ParseLine(string line) {
        if (string.IsNullOrEmpty(line)) return;
        if (line.StartsWith("pid:", StringComparison.Ordinal)) {
            uint pid;
            if (uint.TryParse(line.Substring(4), out pid)) {
                lock (_lock) { _haloPid = pid; }
            }
            return;
        }
        if (line == "nudge") {
            lock (_lock) { _nudgeZ = true; }
            _wake.Set();
            return;
        }
        if (line.StartsWith("config:", StringComparison.Ordinal)) {
            string rest = line.Substring(7);
            string[] parts = rest.Split('|');
            if (parts.Length >= 4) {
                string mode = parts[0] == "top" ? "top" : "bottom";
                bool watchFs = parts[1] == "1";
                bool watchMax = parts[2] == "1";
                List<OverlayEntry> list = new List<OverlayEntry>();
                if (!string.IsNullOrEmpty(parts[3])) {
                    string[] items = parts[3].Split(',');
                    for (int i = 0; i < items.Length; i++) {
                        string[] kv = items[i].Split('=');
                        if (kv.Length < 4) continue;
                        long did;
                        long hwndVal;
                        int cx;
                        int cy;
                        if (long.TryParse(kv[0], out did) &&
                            long.TryParse(kv[1], out hwndVal) &&
                            int.TryParse(kv[2], out cx) &&
                            int.TryParse(kv[3], out cy) &&
                            hwndVal != 0) {
                            OverlayEntry ent = new OverlayEntry();
                            ent.DisplayId = did;
                            ent.Hwnd = new IntPtr(hwndVal);
                            ent.CenterX = cx;
                            ent.CenterY = cy;
                            list.Add(ent);
                        }
                    }
                }
                lock (_lock) {
                    _mode = mode;
                    _watchFs = watchFs;
                    _watchMax = watchMax;
                    _entries = list;
                    _nudgeZ = true;
                    _forceOccEmit = true;
                }
                _wake.Set();
            }
        }
    }

    private static void StdinThread() {
        try {
            string line;
            while ((line = Console.In.ReadLine()) != null) {
                ParseLine(line);
            }
        } catch {
        } finally {
            _eof = true;
            _wake.Set();
        }
    }

    private static string GetWinClass(IntPtr h, StringBuilder sb) {
        sb.Clear();
        int len = GetClassName(h, sb, sb.Capacity);
        return len > 0 ? sb.ToString() : "";
    }

    private static void ApplyZOrder(string mode, List<OverlayEntry> entries, HashSet<IntPtr> overlaySet, bool nudge, StringBuilder clsBuf) {
        if (entries.Count == 0) return;
        bool isTop = mode == "top";
        if (isTop && !nudge) return;

        for (int i = 0; i < entries.Count; i++) {
            IntPtr h = entries[i].Hwnd;
            if (h == IntPtr.Zero || !IsWindowVisible(h)) continue;

            if (isTop) {
                SetWindowPos(h, HWND_TOPMOST, 0, 0, 0, 0, SWP_FLAGS);
            } else {
                IntPtr next = GetWindow(h, GW_HWNDNEXT);
                int guard = 0;
                while (next != IntPtr.Zero && overlaySet.Contains(next) && guard++ < 32) {
                    next = GetWindow(next, GW_HWNDNEXT);
                }
                bool alreadyBottom = next == IntPtr.Zero;
                if (!alreadyBottom) {
                    string cls = GetWinClass(next, clsBuf);
                    if (cls == "Progman" || cls == "WorkerW") {
                        alreadyBottom = true;
                    }
                }
                if (!alreadyBottom) {
                    SetWindowPos(h, HWND_BOTTOM, 0, 0, 0, 0, SWP_FLAGS);
                }
            }
        }
    }

    private static void CheckOcclusion(bool watchFs, bool watchMax, uint haloPid, List<OverlayEntry> entries, HashSet<IntPtr> overlaySet, bool forceEmit, StringBuilder clsBuf) {
        if ((!watchFs && !watchMax) || entries.Count == 0) {
            string emptyJson = "{\"fs\":[],\"max\":[]}";
            if (forceEmit || _lastOccJson != emptyJson) {
                _lastOccJson = emptyJson;
                Console.Out.WriteLine("occ:" + emptyJson);
                Console.Out.Flush();
            }
            return;
        }

        List<MonitorTarget> targets = new List<MonitorTarget>(entries.Count);
        for (int i = 0; i < entries.Count; i++) {
            OverlayEntry e = entries[i];
            POINT pt = new POINT();
            pt.X = e.CenterX;
            pt.Y = e.CenterY;
            IntPtr hMon = MonitorFromPoint(pt, MONITOR_DEFAULTTONEAREST);
            if (hMon == IntPtr.Zero) continue;
            MONITORINFO mi = new MONITORINFO();
            mi.cbSize = Marshal.SizeOf(typeof(MONITORINFO));
            if (!GetMonitorInfo(hMon, ref mi)) continue;
            MonitorTarget t = new MonitorTarget();
            t.DisplayId = e.DisplayId;
            t.Monitor = hMon;
            t.RcMonitor = mi.rcMonitor;
            t.RcWork = mi.rcWork;
            targets.Add(t);
        }

        int quns = 0;
        if (SHQueryUserNotificationState(out quns) == 0 &&
            (quns == QUNS_RUNNING_D3D_FULL_SCREEN || quns == QUNS_PRESENTATION_MODE)) {
            IntPtr fg = GetForegroundWindow();
            if (fg != IntPtr.Zero) {
                uint fgPid = 0;
                GetWindowThreadProcessId(fg, out fgPid);
                if (haloPid == 0 || fgPid != haloPid) {
                    IntPtr fgMon = MonitorFromWindow(fg, MONITOR_DEFAULTTOPRIMARY);
                    if (fgMon != IntPtr.Zero) {
                        for (int i = 0; i < targets.Count; i++) {
                            if (targets[i].Monitor == fgMon) {
                                targets[i].IsFs = true;
                                targets[i].IsMax = true;
                            }
                        }
                    }
                }
            }
        }

        EnumWindows(delegate(IntPtr h, IntPtr lParam) {
            string cls = GetWinClass(h, clsBuf);
            if (cls == "Progman") return false;
            if (cls == "WorkerW" && FindWindowEx(h, IntPtr.Zero, "SHELLDLL_DefView", null) != IntPtr.Zero) {
                return false;
            }

            if (!IsWindowVisible(h) || IsIconic(h) || overlaySet.Contains(h)) return true;

            if (haloPid != 0) {
                uint pid = 0;
                GetWindowThreadProcessId(h, out pid);
                if (pid == haloPid) return true;
            }

            int cloaked = 0;
            if (DwmGetWindowAttribute(h, DWMWA_CLOAKED, out cloaked, 4) == 0 && cloaked != 0) {
                return true;
            }

            if (ShellClasses.Contains(cls)) return true;

            int exStyle = GetWindowLong(h, GWL_EXSTYLE);
            if ((exStyle & (WS_EX_TOOLWINDOW | WS_EX_TRANSPARENT | WS_EX_NOACTIVATE)) != 0) {
                return true;
            }

            int style = GetWindowLong(h, GWL_STYLE);
            if ((exStyle & WS_EX_LAYERED) != 0) {
                uint crKey;
                byte alpha;
                uint lwaFlags;
                if (GetLayeredWindowAttributes(h, out crKey, out alpha, out lwaFlags)) {
                    if ((lwaFlags & LWA_ALPHA) != 0 && alpha < 245) return true;
                } else {
                    if ((style & (WS_CAPTION | WS_THICKFRAME)) == 0) return true;
                }
            }

            RECT r;
            if (DwmGetWindowAttribute(h, DWMWA_EXTENDED_FRAME_BOUNDS, out r, Marshal.SizeOf(typeof(RECT))) != 0) {
                if (!GetWindowRect(h, out r)) return true;
            }

            if ((r.Right - r.Left) < 100 || (r.Bottom - r.Top) < 100) return true;

            bool hasCaption = (style & WS_CAPTION) == WS_CAPTION;
            bool isZoomed = IsZoomed(h);

            for (int i = 0; i < targets.Count; i++) {
                MonitorTarget m = targets[i];
                if (m.IsFs && (!watchMax || m.IsMax)) continue;

                RECT mon = m.RcMonitor;
                RECT wrk = m.RcWork;

                bool coversMonitor = r.Left <= mon.Left + 2 && r.Top <= mon.Top + 2 &&
                                     r.Right >= mon.Right - 2 && r.Bottom >= mon.Bottom - 2;

                bool taskbarVisible = ((mon.Bottom - mon.Top) - (wrk.Bottom - wrk.Top) > 4) ||
                                      ((mon.Right - mon.Left) - (wrk.Right - wrk.Left) > 4);

                if (coversMonitor && (taskbarVisible || !(isZoomed && hasCaption))) {
                    m.IsFs = true;
                    m.IsMax = true;
                    continue;
                }

                if (watchMax && !m.IsMax) {
                    int ix1 = Math.Max(r.Left, wrk.Left);
                    int iy1 = Math.Max(r.Top, wrk.Top);
                    int ix2 = Math.Min(r.Right, wrk.Right);
                    int iy2 = Math.Min(r.Bottom, wrk.Bottom);
                    int iw = Math.Max(0, ix2 - ix1);
                    int ih = Math.Max(0, iy2 - iy1);
                    double workArea = (double)Math.Max(1, wrk.Right - wrk.Left) * (double)Math.Max(1, wrk.Bottom - wrk.Top);
                    double interArea = (double)iw * (double)ih;
                    bool coversWork95 = interArea >= workArea * 0.95;
                    bool coversWork4px = r.Left <= wrk.Left + 4 && r.Top <= wrk.Top + 4 &&
                                         r.Right >= wrk.Right - 4 && r.Bottom >= wrk.Bottom - 4;
                    if ((isZoomed && coversWork95) || coversWork4px) {
                        m.IsMax = true;
                    }
                }
            }
            return true;
        }, IntPtr.Zero);

        StringBuilder jb = new StringBuilder(96);
        jb.Append("{\"fs\":[");
        bool first = true;
        for (int i = 0; i < targets.Count; i++) {
            if (targets[i].IsFs) {
                if (!first) jb.Append(',');
                jb.Append(targets[i].DisplayId);
                first = false;
            }
        }
        jb.Append("],\"max\":[");
        first = true;
        for (int i = 0; i < targets.Count; i++) {
            if (targets[i].IsMax) {
                if (!first) jb.Append(',');
                jb.Append(targets[i].DisplayId);
                first = false;
            }
        }
        jb.Append("]}");

        string json = jb.ToString();
        if (forceEmit || json != _lastOccJson) {
            _lastOccJson = json;
            Console.Out.WriteLine("occ:" + json);
            Console.Out.Flush();
        }
    }

    public static void Run() {
        Thread t = new Thread(StdinThread);
        t.IsBackground = true;
        t.Start();

        StringBuilder clsBuf = new StringBuilder(128);
        while (!_eof) {
            string mode;
            bool watchFs;
            bool watchMax;
            uint haloPid;
            List<OverlayEntry> entries;
            bool nudge;
            bool forceEmit;

            lock (_lock) {
                mode = _mode;
                watchFs = _watchFs;
                watchMax = _watchMax;
                haloPid = _haloPid;
                entries = _entries;
                nudge = _nudgeZ;
                forceEmit = _forceOccEmit;
                _nudgeZ = false;
                _forceOccEmit = false;
            }

            HashSet<IntPtr> overlaySet = new HashSet<IntPtr>();
            for (int i = 0; i < entries.Count; i++) {
                overlaySet.Add(entries[i].Hwnd);
            }

            try {
                ApplyZOrder(mode, entries, overlaySet, nudge, clsBuf);
            } catch (Exception ex) {
                Console.Error.WriteLine("zorder: " + ex.Message);
            }

            try {
                CheckOcclusion(watchFs, watchMax, haloPid, entries, overlaySet, forceEmit, clsBuf);
            } catch (Exception ex) {
                Console.Error.WriteLine("occlusion: " + ex.Message);
            }

            if (_eof) break;
            int waitMs = (watchFs || watchMax) ? 650 : (mode == "bottom" ? 1500 : 5000);
            _wake.WaitOne(waitMs);
        }
    }
}
'@

[HaloWin]::Run()
