# Keeps Halo's overlay windows at the bottom of the window stack (behind every app)
# or on top, depending on the mode Halo sends. Input lines look like:  bottom:123456,789012
Add-Type @"
using System;
using System.Runtime.InteropServices;
public class HaloZ {
  [DllImport("user32.dll")]
  public static extern bool SetWindowPos(IntPtr hWnd, IntPtr hWndInsertAfter, int X, int Y, int cx, int cy, uint uFlags);
}
"@

$BOTTOM  = [IntPtr]1
$TOPMOST = [IntPtr]::new(-1)
$FLAGS   = 0x0013   # SWP_NOSIZE | SWP_NOMOVE | SWP_NOACTIVATE

while ($true) {
    $line = [Console]::In.ReadLine()
    if ($null -eq $line) { break }
    $parts = $line.Split(':')
    if ($parts.Count -lt 2) { continue }
    $after = if ($parts[0] -eq 'top') { $TOPMOST } else { $BOTTOM }
    foreach ($h in $parts[1].Split(',')) {
        if ($h) {
            try { [void][HaloZ]::SetWindowPos([IntPtr]::new([int64]$h), $after, 0, 0, 0, 0, $FLAGS) }
            catch { [Console]::Error.WriteLine("zorder: $($_.Exception.Message)") }
        }
    }
}
