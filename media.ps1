# Streams all active Windows media sessions (Spotify app, browser tabs, etc.)
# as one JSON object per line on stdout, and fetches album thumbnails on demand
# when main.js writes "thumb:<key>" on stdin. Errors go to stderr for Halo logs.
$ErrorActionPreference = 'Continue'
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

Add-Type -TypeDefinition @'
using System;
using System.Collections.Concurrent;
using System.IO;
using System.Text;
using System.Threading;

public static class HaloStdin {
    public static readonly ConcurrentQueue<string> Lines = new ConcurrentQueue<string>();
    public static volatile bool Eof = false;
    private static int _started = 0;

    public static void Start() {
        if (Interlocked.Exchange(ref _started, 1) != 0) return;
        var t = new Thread(() => {
            try {
                using (var sr = new StreamReader(Console.OpenStandardInput(), new UTF8Encoding(false), false, 1024, true)) {
                    string line;
                    while ((line = sr.ReadLine()) != null) {
                        Lines.Enqueue(line);
                    }
                }
            } catch {
            } finally {
                Eof = true;
            }
        });
        t.IsBackground = true;
        t.Start();
    }
}
'@

Add-Type -AssemblyName System.Runtime.WindowsRuntime
$null = [Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager, Windows.Media.Control, ContentType = WindowsRuntime]
$null = [Windows.Media.Control.GlobalSystemMediaTransportControlsSessionMediaProperties, Windows.Media.Control, ContentType = WindowsRuntime]
$null = [Windows.Storage.Streams.IRandomAccessStreamWithContentType, Windows.Storage.Streams, ContentType = WindowsRuntime]
$null = [Windows.Storage.Streams.IInputStream, Windows.Storage.Streams, ContentType = WindowsRuntime]

$asTask = ([System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object {
    $_.Name -eq 'AsTask' -and $_.GetParameters().Count -eq 1 -and
    $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncOperation`1'
})[0]
$asStream = [System.IO.WindowsRuntimeStreamExtensions].GetMethod('AsStreamForRead', [Type[]]@([Windows.Storage.Streams.IInputStream]))

function Await($op, $type) {
    $task = $asTask.MakeGenericMethod($type).Invoke($null, @($op))
    $null = $task.Wait(-1)
    $task.Result
}

function Get-Thumbnail($props) {
    try {
        if (-not $props.Thumbnail) { return $null }
        $stream = Await ($props.Thumbnail.OpenReadAsync()) ([Windows.Storage.Streams.IRandomAccessStreamWithContentType])
        if (-not $stream) { return $null }
        $net = $asStream.Invoke($null, @($stream))
        if (-not $net) { return $null }
        $ms = New-Object System.IO.MemoryStream
        try {
            $net.CopyTo($ms)
            $bytes = $ms.ToArray()
            if ($bytes.Length -eq 0) { return $null }
            return [Convert]::ToBase64String($bytes)
        } finally {
            $ms.Dispose()
            $net.Dispose()
            try { ([IDisposable]$stream).Dispose() } catch { }
        }
    } catch {
        [Console]::Error.WriteLine("thumbnail: $($_.Exception.Message)")
        return $null
    }
}

$mgrType = [Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager]
$mgr = Await ($mgrType::RequestAsync()) $mgrType
$propsType = [Windows.Media.Control.GlobalSystemMediaTransportControlsSessionMediaProperties]
$wantThumb = ''
$idle = $false
$lastJson = ''
[HaloStdin]::Start()

while ($true) {
    $cmdLine = $null
    while ([HaloStdin]::Lines.TryDequeue([ref]$cmdLine)) {
        if ($cmdLine.StartsWith('thumb:')) {
            $wantThumb = $cmdLine.Substring(6)
        } elseif ($cmdLine -eq 'idle:1') {
            $idle = $true
        } elseif ($cmdLine -eq 'idle:0') {
            $idle = $false
        }
    }
    if ([HaloStdin]::Eof) { break }

    $sleepMs = if ($idle) { 2000 } else { 1200 }
    try {
        $cur = $null
        try { $cur = $mgr.GetCurrentSession() } catch { }
        $curApp = if ($cur) { [string]$cur.SourceAppUserModelId } else { '' }
        $all = $mgr.GetSessions()
        $list = [System.Collections.Generic.List[object]]::new()
        $anyPlaying = $false
        $attachedThumb = $false

        foreach ($x in $all) {
            try {
                $props = Await ($x.TryGetMediaPropertiesAsync()) $propsType
                $pb = $x.GetPlaybackInfo()
                $appId = [string]$x.SourceAppUserModelId
                $title = [string]$props.Title
                $artist = [string]$props.Artist
                $album = [string]$props.AlbumTitle
                $key = "$appId|$artist|$title"
                $playing = ($pb.PlaybackStatus.ToString() -eq 'Playing')
                if ($playing) { $anyPlaying = $true }
                $typeStr = if ($pb.PlaybackType) {
                    $pb.PlaybackType.ToString()
                } elseif ($props.PlaybackType) {
                    $props.PlaybackType.ToString()
                } else {
                    ''
                }

                $dur = 0; $pos = 0
                try {
                    $tl = $x.GetTimelineProperties()
                    $dur = ($tl.EndTime - $tl.StartTime).TotalMilliseconds
                    $pos = $tl.Position.TotalMilliseconds
                    if ($playing) {
                        $pos += ([DateTimeOffset]::UtcNow - $tl.LastUpdatedTime).TotalMilliseconds
                    }
                    if ($dur -gt 0 -and $pos -gt $dur) { $pos = $dur }
                    if ($pos -lt 0) { $pos = 0 }
                } catch { }

                $o = [ordered]@{
                    key      = $key
                    title    = $title
                    artist   = $artist
                    album    = $album
                    app      = $appId
                    type     = $typeStr
                    playing  = $playing
                    current  = ($curApp -ne '' -and $appId -eq $curApp)
                    posMs    = [int64]$pos
                    durMs    = [int64]$dur
                    hasThumb = ($null -ne $props.Thumbnail)
                }

                if (-not $idle -and $wantThumb -and $wantThumb -eq $key) {
                    $art = Get-Thumbnail $props
                    if ($art) {
                        $o.art = $art
                        $attachedThumb = $true
                    }
                    $wantThumb = ''
                }

                $list.Add($o)
            } catch {
                [Console]::Error.WriteLine("session: $($_.Exception.Message)")
            }
        }

        if ($list.Count -eq 0) {
            $json = '{"sessions":[]}'
            if ($json -ne $lastJson) {
                [Console]::Out.WriteLine($json)
                [Console]::Out.Flush()
                $lastJson = $json
            }
            $sleepMs = if ($idle) { 2000 } else { 1500 }
        } else {
            $payload = [ordered]@{ sessions = $list.ToArray() }
            $json = $payload | ConvertTo-Json -Compress -Depth 4
            if ($anyPlaying -and -not $idle) {
                [Console]::Out.WriteLine($json)
                [Console]::Out.Flush()
                $lastJson = $json
                $sleepMs = 500
            } else {
                if ($attachedThumb -or $json -ne $lastJson) {
                    [Console]::Out.WriteLine($json)
                    [Console]::Out.Flush()
                    $lastJson = $json
                }
                $sleepMs = if ($idle) { 2000 } else { 1200 }
            }
        }
    } catch {
        [Console]::Error.WriteLine("loop: $($_.Exception.Message)")
    }
    Start-Sleep -Milliseconds $sleepMs
}
