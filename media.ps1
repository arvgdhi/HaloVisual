# Streams the active Windows media session (Spotify app, Chrome/Edge tabs, etc.)
# as one JSON object per line on stdout. Errors go to stderr so Halo can log them.
$ErrorActionPreference = 'Continue'
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

Add-Type -AssemblyName System.Runtime.WindowsRuntime
$null = [Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager, Windows.Media.Control, ContentType = WindowsRuntime]
$null = [Windows.Media.Control.GlobalSystemMediaTransportControlsSessionMediaProperties, Windows.Media.Control, ContentType = WindowsRuntime]
$null = [Windows.Storage.Streams.DataReader, Windows.Storage.Streams, ContentType = WindowsRuntime]
$null = [Windows.Storage.Streams.IRandomAccessStreamWithContentType, Windows.Storage.Streams, ContentType = WindowsRuntime]

$asTask = ([System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object {
    $_.Name -eq 'AsTask' -and $_.GetParameters().Count -eq 1 -and
    $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncOperation`1'
})[0]

function Await($op, $type) {
    $task = $asTask.MakeGenericMethod($type).Invoke($null, @($op))
    $null = $task.Wait(-1)
    $task.Result
}

function Get-Thumbnail($props) {
    try {
        if (-not $props.Thumbnail) { return $null }
        $stream = Await ($props.Thumbnail.OpenReadAsync()) ([Windows.Storage.Streams.IRandomAccessStreamWithContentType])
        if (-not $stream -or $stream.Size -eq 0) { return $null }
        $reader = [Windows.Storage.Streams.DataReader]::new($stream)
        $null = Await ($reader.LoadAsync([uint32]$stream.Size)) ([uint32])
        $bytes = New-Object byte[] $stream.Size
        $reader.ReadBytes($bytes)
        $reader.Dispose()
        $stream.Dispose()
        return [Convert]::ToBase64String($bytes)
    } catch {
        [Console]::Error.WriteLine("thumbnail: $($_.Exception.Message)")
        return $null
    }
}

$mgrType = [Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager]
$mgr = Await ($mgrType::RequestAsync()) $mgrType
$propsType = [Windows.Media.Control.GlobalSystemMediaTransportControlsSessionMediaProperties]
$artSentFor = ''

function Pick-Session($mgr) {
    # Prefer a session that is actually playing (e.g. a Spotify web tab), else the system's current one.
    $best = $null
    foreach ($x in $mgr.GetSessions()) {
        try {
            if ($x.GetPlaybackInfo().PlaybackStatus.ToString() -eq 'Playing') { $best = $x; break }
        } catch { }
    }
    if ($best) { return $best }
    return $mgr.GetCurrentSession()
}

while ($true) {
    try {
        $s = Pick-Session $mgr
        if (-not $s) {
            [Console]::Out.WriteLine('{"none":true}')
        } else {
            $props = Await ($s.TryGetMediaPropertiesAsync()) $propsType
            $pb = $s.GetPlaybackInfo()
            $playing = ($pb.PlaybackStatus.ToString() -eq 'Playing')
            $key = "$($props.Artist)|$($props.Title)"

            $dur = 0; $pos = 0
            try {
                $tl = $s.GetTimelineProperties()
                $dur = ($tl.EndTime - $tl.StartTime).TotalMilliseconds
                $pos = $tl.Position.TotalMilliseconds
                if ($playing) {
                    $pos += ([DateTimeOffset]::UtcNow - $tl.LastUpdatedTime).TotalMilliseconds
                }
                if ($dur -gt 0 -and $pos -gt $dur) { $pos = $dur }
                if ($pos -lt 0) { $pos = 0 }
            } catch { }

            $o = [ordered]@{
                key     = $key
                title   = [string]$props.Title
                artist  = [string]$props.Artist
                album   = [string]$props.AlbumTitle
                app     = [string]$s.SourceAppUserModelId
                playing = $playing
                posMs   = [int64]$pos
                durMs   = [int64]$dur
            }
            # Send the cover once per track; a failure here must never drop the whole update
            if ($artSentFor -ne $key) {
                $art = Get-Thumbnail $props
                if ($art) { $o.art = $art; $artSentFor = $key }
            }
            [Console]::Out.WriteLine(($o | ConvertTo-Json -Compress))
        }
        [Console]::Out.Flush()
    } catch {
        [Console]::Error.WriteLine("loop: $($_.Exception.Message)")
    }
    Start-Sleep -Milliseconds 400
}
