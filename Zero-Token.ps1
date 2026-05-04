[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
$Host.UI.RawUI.WindowTitle = "Zero-Token"

$Providers = @(
    @{ Num= 1; Id="deepseek-web";   Label="DeepSeek";          Site="chat.deepseek.com" }
    @{ Num= 2; Id="qwen-web";       Label="Qwen";              Site="chat.qwen.ai" }
    @{ Num= 3; Id="qwen-cn-web";    Label="Qwen CN";           Site="chat2.qianwen.com" }
    @{ Num= 4; Id="doubao-web";     Label="Doubao";             Site="www.doubao.com" }
    @{ Num= 5; Id="kimi-web";       Label="Kimi";               Site="www.kimi.com" }
    @{ Num= 6; Id="chatgpt-web";    Label="ChatGPT";            Site="chatgpt.com" }
    @{ Num= 7; Id="claude-web";     Label="Claude";             Site="claude.ai" }
    @{ Num= 8; Id="gemini-web";     Label="Gemini";             Site="gemini.google.com" }
    @{ Num= 9; Id="grok-web";       Label="Grok";               Site="grok.com" }
    @{ Num=10; Id="perplexity-web"; Label="Perplexity";         Site="www.perplexity.ai" }
)

$OpenClawCmd = $null
$clawDirs = Get-ChildItem $env:LOCALAPPDATA -Directory -Filter ".clawhub*" -ErrorAction SilentlyContinue
foreach ($d in $clawDirs) {
    $candidate = Join-Path $d.FullName "bin\openclaw.cmd"
    if (Test-Path $candidate) { $OpenClawCmd = $candidate; break }
}

$ConfigDir = Join-Path $env:USERPROFILE ".openclaw"
$ConfigFile = Join-Path $ConfigDir "openclaw.json"

function Write-Banner {
    Clear-Host
    Write-Host ""
    Write-Host "  ==============================================" -ForegroundColor Cyan
    Write-Host "       Zero-Token" -ForegroundColor White
    Write-Host "       免 API Key，浏览器登录即用 AI" -ForegroundColor Gray
    Write-Host "  ==============================================" -ForegroundColor Cyan
    Write-Host ""
}

function Detect-Browsers {
    $browsers = @()
    $localApp = $env:LOCALAPPDATA
    $pf = $env:ProgramFiles
    $pf86 = ${env:ProgramFiles(x86)}

    $candidates = @(
        @{ Label="Google Chrome";  Kind="chrome"; Path="$localApp\Google\Chrome\Application\chrome.exe" }
        @{ Label="Google Chrome";  Kind="chrome"; Path="$pf\Google\Chrome\Application\chrome.exe" }
        @{ Label="Google Chrome";  Kind="chrome"; Path="$pf86\Google\Chrome\Application\chrome.exe" }
        @{ Label="Microsoft Edge"; Kind="edge";   Path="$pf\Microsoft\Edge\Application\msedge.exe" }
        @{ Label="Microsoft Edge"; Kind="edge";   Path="$pf86\Microsoft\Edge\Application\msedge.exe" }
        @{ Label="Microsoft Edge"; Kind="edge";   Path="$localApp\Microsoft\Edge\Application\msedge.exe" }
        @{ Label="Brave";          Kind="brave";  Path="$localApp\BraveSoftware\Brave-Browser\Application\brave.exe" }
        @{ Label="Brave";          Kind="brave";  Path="$pf\BraveSoftware\Brave-Browser\Application\brave.exe" }
        @{ Label="Chromium";       Kind="chromium"; Path="$localApp\Chromium\Application\chrome.exe" }
    )

    $seen = @{}
    foreach ($c in $candidates) {
        if ((Test-Path $c.Path) -and (-not $seen.ContainsKey($c.Kind))) {
            $seen[$c.Kind] = $true
            $browsers += @{ Label=$c.Label; Kind=$c.Kind; Path=$c.Path }
        }
    }
    return $browsers
}

function Set-BrowserInConfig {
    param([string]$BrowserPath)

    # 用 Node.js 安全地修改 JSON，保留格式和所有字段
    $nodeScript = @"
const fs = require('fs');
const p = process.argv[1];
const f = process.argv[2];
try {
  const j = JSON.parse(fs.readFileSync(f, 'utf8'));
  if (!j.browser) j.browser = {};
  j.browser.executablePath = p;
  fs.writeFileSync(f, JSON.stringify(j, null, 2), 'utf8');
  console.log('OK');
} catch(e) { console.error(e.message); process.exit(1); }
"@
    & node -e $nodeScript $BrowserPath $ConfigFile 2>&1 | Out-Null
}

function Select-Browser {
    $browsers = Detect-Browsers
    if ($browsers.Count -eq 0) {
        Write-Host "  [x] 未检测到 Chromium 浏览器！" -ForegroundColor Red
        Write-Host "  请先安装 Chrome、Edge 或 Brave" -ForegroundColor Yellow
        return
    }

    if ($browsers.Count -eq 1) {
        Set-BrowserInConfig -BrowserPath $browsers[0].Path
        Write-Host "  已自动检测到: $($browsers[0].Label)" -ForegroundColor Green
        Write-Host "  路径: $($browsers[0].Path)" -ForegroundColor Gray
        return
    }

    Clear-Host
    Write-Host ""
    Write-Host "  ==============================================" -ForegroundColor Cyan
    Write-Host "       选择浏览器" -ForegroundColor White
    Write-Host "       登录和 API 调用都会使用此浏览器" -ForegroundColor Gray
    Write-Host "  ==============================================" -ForegroundColor Cyan
    Write-Host ""

    for ($i = 0; $i -lt $browsers.Count; $i++) {
        $num = $i + 1
        $label = $browsers[$i].Label.PadRight(18)
        Write-Host "    [$num] $label $($browsers[$i].Path)" -ForegroundColor White
    }

    Write-Host ""
    $pick = Read-Host "  请输入选项 (1-$($browsers.Count))，直接回车选第一个"

    if ($pick -eq "" -or $pick -eq "1") {
        $pick = "1"
    }

    $idx = [int]$pick - 1
    if ($idx -ge 0 -and $idx -lt $browsers.Count) {
        $selected = $browsers[$idx]
        Set-BrowserInConfig -BrowserPath $selected.Path
        Write-Host "  已设置浏览器: $($selected.Label)" -ForegroundColor Green
        Write-Host "  路径: $($selected.Path)" -ForegroundColor Gray
    } else {
        Write-Host "  无效选项，使用默认: $($browsers[0].Label)" -ForegroundColor Yellow
        Set-BrowserInConfig -BrowserPath $browsers[0].Path
    }
}

function Do-Install {
    Write-Host ""

    if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
        $ok = Install-NodeJS
        if (-not $ok) { return $false }
    }
    $nodeVer = (node -v) -replace '^v','' -split '\.' | Select-Object -First 1
    if ([int]$nodeVer -lt 22) {
        $ok = Install-NodeJS
        if (-not $ok) { return $false }
    }

    $projectDir = $PSScriptRoot

    # ── Step 1/5: 安装项目依赖 ──
    Draw-ProgressBar 5 "安装项目依赖..."
    Push-Location $projectDir
    & npm install 2>&1 | Out-Null
    if (-not (Test-Path (Join-Path $projectDir "node_modules"))) {
        Finish-ProgressBar "[x] 依赖安装失败，请检查网络连接" "Red"
        Pop-Location
        return $false
    }
    Pop-Location

    # ── Step 2/5: 构建插件 ──
    Draw-ProgressBar 30 "构建插件..."
    Push-Location $projectDir
    & node build.mjs 2>&1 | Out-Null
    Pop-Location
    if (-not (Test-Path (Join-Path $projectDir "dist\index.js"))) {
        Finish-ProgressBar "[x] 构建失败" "Red"
        return $false
    }

    # ── Step 3/4: 部署插件 ──
    Draw-ProgressBar 55 "部署插件..."
    $extDir = Join-Path $env:USERPROFILE ".openclaw\extensions\zero-token"
    $extDist = Join-Path $extDir "dist"
    if (-not (Test-Path $extDist)) { New-Item -ItemType Directory -Path $extDist -Force | Out-Null }
    Copy-Item (Join-Path $projectDir "dist\index.js") $extDist -Force
    Copy-Item (Join-Path $projectDir "package.json") $extDir -Force
    Copy-Item (Join-Path $projectDir "openclaw.plugin.json") $extDir -Force

    # ── Step 4/4: 安装插件运行时依赖 ──
    Draw-ProgressBar 70 "安装插件运行时依赖..."
    Push-Location $extDir
    & npm install --omit=dev --silent 2>&1 | Out-Null
    Pop-Location

    Draw-ProgressBar 100 "完成"
    Finish-ProgressBar "[√] Zero-Token 插件安装完成！" "Green"
    return $true
}

function Start-Gateway {
    Clear-Host
    Write-Host ""
    Write-Host "  正在启动 Zero-Token 服务..." -ForegroundColor Cyan
    Write-Host ""

    # 自动停止旧的 gateway 进程
    & $OpenClawCmd gateway stop 2>&1 | Out-Null

    # 杀掉占用 18789 和 18800 端口的残留进程
    $ports = @(18789, 18800)
    foreach ($port in $ports) {
        $lines = netstat -ano | Select-String ":$port\s.*LISTENING"
        foreach ($line in $lines) {
            if ($line -match '\s(\d+)\s*$') {
                $pid = $Matches[1]
                taskkill /PID $pid /F 2>&1 | Out-Null
            }
        }
    }

    Write-Host "  网址:  http://127.0.0.1:18789/" -ForegroundColor White
    Write-Host "  关闭此窗口即可停止服务" -ForegroundColor Gray
    Write-Host ""

    # 后台轮询等网关可用再打开浏览器（最多60秒）
    $waitScript = 'for($i=0;$i -lt 60;$i++){try{Invoke-WebRequest -Uri "http://127.0.0.1:18789/" -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop | Out-Null; Start-Process "http://127.0.0.1:18789/"; exit}catch{Start-Sleep 1}}'
    Start-Process powershell -ArgumentList "-NoProfile -Command $waitScript" -WindowStyle Hidden

    & $OpenClawCmd gateway run

    Write-Host ""
    Write-Host "  服务已停止。" -ForegroundColor Yellow
    Read-Host "  按回车退出"
    exit 0
}

# ══════════════════════════════════════
# 自动环境安装函数
# ══════════════════════════════════════

function Refresh-Path {
    $env:Path = [Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [Environment]::GetEnvironmentVariable("Path", "User")
}

function Find-OpenClawCmd {
    $found = $null
    $clawDirs = Get-ChildItem $env:LOCALAPPDATA -Directory -Filter ".clawhub*" -ErrorAction SilentlyContinue
    foreach ($d in $clawDirs) {
        $candidate = Join-Path $d.FullName "bin\openclaw.cmd"
        if (Test-Path $candidate) { $found = $candidate; break }
    }
    return $found
}

# ── 进度条绘制 ──
function Draw-ProgressBar {
    param([int]$Percent, [string]$Status)
    $barWidth = 30
    $filled = [math]::Floor($barWidth * $Percent / 100)
    $empty = $barWidth - $filled
    $bar = ("█" * $filled) + ("░" * $empty)
    $line = "  [$bar] ${Percent}%  $Status"
    # 回到行首覆盖
    Write-Host "`r$line".PadRight(70) -NoNewline -ForegroundColor Cyan
}

function Finish-ProgressBar {
    param([string]$Message, [string]$Color = "Green")
    Write-Host ""
    Write-Host "  $Message" -ForegroundColor $Color
}

function Install-NodeJS {
    Write-Banner
    Write-Host "  正在自动安装 Node.js 22 LTS..." -ForegroundColor Yellow
    Write-Host ""

    $arch = if ([Environment]::Is64BitOperatingSystem) { "x64" } else { "x86" }
    $nodeVersion = "22.15.0"
    $msiUrl = "https://nodejs.org/dist/v${nodeVersion}/node-v${nodeVersion}-${arch}.msi"
    $msiPath = Join-Path $env:TEMP "node-v${nodeVersion}-${arch}.msi"

    # ── 下载（带进度）──
    Draw-ProgressBar 0 "连接 nodejs.org..."
    try {
        [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
        $wc = New-Object System.Net.WebClient
        $dlDone = $false
        Register-ObjectEvent $wc DownloadProgressChanged -Action {
            Draw-ProgressBar ([math]::Min($EventArgs.ProgressPercentage, 60)) "下载 Node.js v$using:nodeVersion..."
        } | Out-Null
        Register-ObjectEvent $wc DownloadFileCompleted -Action { $using:dlDone = $true } | Out-Null
        $wc.DownloadFileAsync([Uri]$msiUrl, $msiPath)
        # 等待下载完成（轮询）
        while (-not (Test-Path $msiPath) -or (Get-Item $msiPath -ErrorAction SilentlyContinue).Length -lt 1000) {
            Start-Sleep -Milliseconds 500
        }
        # 等 WebClient 真正完成
        $timeout = 300
        while ($timeout -gt 0) {
            if ((Get-Item $msiPath -ErrorAction SilentlyContinue).Length -gt 10000000) { break }
            Start-Sleep 1
            $timeout--
            $pct = [math]::Min(60, [int]((Get-Item $msiPath -ErrorAction SilentlyContinue).Length / 350000))
            Draw-ProgressBar $pct "下载 Node.js v${nodeVersion}..."
        }
        $wc.Dispose()
    } catch {
        Finish-ProgressBar "[x] 下载失败，请手动安装: https://nodejs.org/" "Red"
        return $false
    }

    if (-not (Test-Path $msiPath) -or (Get-Item $msiPath).Length -lt 1000000) {
        Finish-ProgressBar "[x] 下载不完整，请重试" "Red"
        return $false
    }

    # ── 安装 ──
    Draw-ProgressBar 65 "安装 Node.js（需要管理员权限）..."
    try {
        $proc = Start-Process msiexec -ArgumentList "/i `"$msiPath`" /qn /norestart" -Verb RunAs -Wait -PassThru
        if ($proc.ExitCode -ne 0) {
            Finish-ProgressBar "[x] 安装失败 (exit code: $($proc.ExitCode))" "Red"
            return $false
        }
    } catch {
        Finish-ProgressBar "[x] 安装失败（用户取消或权限不足），请手动安装: https://nodejs.org/" "Red"
        return $false
    }

    Draw-ProgressBar 90 "配置环境变量..."
    Refresh-Path
    Start-Sleep -Seconds 2
    if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
        $nodePath = Join-Path $env:ProgramFiles "nodejs"
        if (Test-Path $nodePath) { $env:Path += ";$nodePath" }
    }

    # ── 验证 ──
    Draw-ProgressBar 100 "验证..."
    if (Get-Command node -ErrorAction SilentlyContinue) {
        $ver = node -v
        Finish-ProgressBar "[√] Node.js $ver 安装成功！" "Green"
        Remove-Item $msiPath -Force -ErrorAction SilentlyContinue
        return $true
    } else {
        Finish-ProgressBar "[x] 安装后无法找到 Node.js，请重启终端后重试" "Red"
        return $false
    }
}

function Install-OpenClaw {
    Write-Banner
    Write-Host "  正在自动安装 OpenClaw..." -ForegroundColor Yellow
    Write-Host ""

    Draw-ProgressBar 0 "准备安装..."

    # 启动后台安装进程，不显示日志
    $job = Start-Job -ScriptBlock {
        & npm install -g openclaw 2>&1 | Out-Null
        return $LASTEXITCODE
    }

    # 模拟进度（npm install 通常需要 20-60 秒）
    $pct = 5
    while ($job.State -eq "Running") {
        if ($pct -lt 90) { $pct += 2 }
        Draw-ProgressBar $pct "安装 OpenClaw..."
        Start-Sleep 1
    }

    $exitCode = Receive-Job $job
    Remove-Job $job -Force

    Draw-ProgressBar 95 "配置环境..."
    Refresh-Path
    Start-Sleep -Seconds 2

    # 重新扫描
    $script:OpenClawCmd = Find-OpenClawCmd

    if ($script:OpenClawCmd) {
        Draw-ProgressBar 100 "完成"
        Finish-ProgressBar "[√] OpenClaw 安装成功！" "Green"
        return $true
    } else {
        Finish-ProgressBar "[x] 安装后未找到 OpenClaw，请重启终端后重试" "Red"
        return $false
    }
}

# ══════════════════════════════════════
# 前置检查（自动安装）
# ══════════════════════════════════════

# ── Step 1: 检测 Node.js ──
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Banner
    Write-Host "  未检测到 Node.js，即将自动安装..." -ForegroundColor Yellow
    Write-Host ""
    $ok = Install-NodeJS
    if (-not $ok) {
        Read-Host "  按回车退出"
        exit 1
    }
} else {
    $nodeVer = (node -v) -replace '^v','' -split '\.' | Select-Object -First 1
    if ([int]$nodeVer -lt 22) {
        Write-Banner
        Write-Host "  Node.js 版本过低（当前 v$nodeVer，需要 22+），即将自动升级..." -ForegroundColor Yellow
        Write-Host ""
        $ok = Install-NodeJS
        if (-not $ok) {
            Read-Host "  按回车退出"
            exit 1
        }
    }
}

# ── Step 2: 检测 OpenClaw ──
if (-not $OpenClawCmd) {
    Write-Banner
    Write-Host "  未检测到 OpenClaw，即将自动安装..." -ForegroundColor Yellow
    Write-Host ""
    $ok = Install-OpenClaw
    if (-not $ok) {
        Read-Host "  按回车退出"
        exit 1
    }
    $OpenClawCmd = $script:OpenClawCmd
}

$installed = Test-Path (Join-Path $env:USERPROFILE ".openclaw\extensions\zero-token\dist\index.js")
if (-not $installed) {
    Write-Banner
    Write-Host "  首次使用，需要初始化设置" -ForegroundColor Yellow
    Write-Host ""

    Select-Browser
    Write-Host ""
    Read-Host "  按回车开始安装插件（约30秒）"
    $result = Do-Install
    if (-not $result) {
        Read-Host "  按回车退出"
        exit 1
    }
    Start-Sleep -Seconds 1
}

# ══════════════════════════════════════
# 主菜单
# ══════════════════════════════════════
while ($true) {
    Write-Banner

    # ── 状态检测 ──
    # 浏览器
    $browserName = "未配置"
    if (Test-Path $ConfigFile) {
        try {
            $cfg = Get-Content $ConfigFile -Raw | ConvertFrom-Json
            $exePath = $cfg.browser.executablePath
            if ($exePath -and (Test-Path $exePath)) {
                $browserName = (Split-Path $exePath -Leaf) -replace '\.exe$',''
            } elseif ($exePath) {
                $browserName = "$((Split-Path $exePath -Leaf)) (未找到)"
            }
        } catch {}
    }
    # 已登录账号
    $loggedIn = @()
    if (Test-Path $ConfigFile) {
        try {
            $cfg = Get-Content $ConfigFile -Raw | ConvertFrom-Json
            $profiles = $cfg.auth.profiles.PSObject.Properties.Name
            foreach ($p in $profiles) {
                $providerId = ($p -split ':')[0]
                $match = $Providers | Where-Object { $_.Id -eq $providerId }
                if ($match) { $loggedIn += $match.Label }
            }
        } catch {}
    }
    # 网关状态
    $gwRunning = $false
    try {
        $conn = Get-NetTCPConnection -LocalPort 18789 -State Listen -ErrorAction SilentlyContinue
        if ($conn) { $gwRunning = $true }
    } catch {}

    Write-Host "  ── 当前状态 ──" -ForegroundColor DarkGray
    Write-Host "    浏览器: " -NoNewline -ForegroundColor DarkGray
    Write-Host $browserName -ForegroundColor Yellow
    Write-Host "    已登录: " -NoNewline -ForegroundColor DarkGray
    if ($loggedIn.Count -gt 0) {
        Write-Host ($loggedIn -join ", ") -ForegroundColor Green
    } else {
        Write-Host "无" -ForegroundColor Red
    }
    Write-Host "    网关:   " -NoNewline -ForegroundColor DarkGray
    if ($gwRunning) {
        Write-Host "运行中 (端口 18789)" -ForegroundColor Green
    } else {
        Write-Host "未启动" -ForegroundColor DarkGray
    }
    Write-Host ""

    Write-Host "    [1] 登录 AI 账号" -ForegroundColor White
    Write-Host "    [2] 启动服务并打开网页" -ForegroundColor White
    Write-Host "    [3] 重新安装 / 更新插件" -ForegroundColor White
    Write-Host "    [4] 切换浏览器" -ForegroundColor White
    Write-Host "    [0] 退出" -ForegroundColor Gray
    Write-Host ""
    $choice = Read-Host "  请输入选项 (0-4)"

    if ($choice -eq "0") { exit 0 }

    if ($choice -eq "2") {
        Start-Gateway
    }

    if ($choice -eq "3") {
        Do-Install
        Write-Host ""
        Read-Host "  按回车返回主菜单"
    }

    if ($choice -eq "4") {
        Select-Browser
        Write-Host ""
        Read-Host "  按回车返回主菜单"
    }

    if ($choice -eq "1") {
        $shouldStart = $false

        while ($true) {
            Clear-Host
            Write-Host ""
            Write-Host "  ==============================================" -ForegroundColor Cyan
            Write-Host "       选择要登录的 AI 服务" -ForegroundColor White
            Write-Host "       浏览器会自动弹出，登录后自动获取凭据" -ForegroundColor Gray
            Write-Host "  ==============================================" -ForegroundColor Cyan
            Write-Host ""
            foreach ($p in $Providers) {
                $num = $p.Num.ToString().PadLeft(2)
                $label = $p.Label.PadRight(20)
                Write-Host "    [$num] $label $($p.Site)" -ForegroundColor White
            }
            Write-Host ""
            Write-Host "    [ 0] 返回主菜单" -ForegroundColor Gray
            Write-Host ""
            $loginChoice = Read-Host "  请输入选项 (0-13)"

            if ($loginChoice -eq "0") { break }

            $selected = $Providers | Where-Object { $_.Num -eq [int]$loginChoice }
            if (-not $selected) {
                Write-Host "  无效选项" -ForegroundColor Red
                Start-Sleep 1
                continue
            }

            Write-Host ""
            Write-Host "  正在登录 $($selected.Label) ($($selected.Site))..." -ForegroundColor Yellow
            Write-Host "  浏览器即将弹出，请完成登录/扫码" -ForegroundColor Yellow
            Write-Host ""

            & $OpenClawCmd models auth login --provider $selected.Id --method browser-login

            Write-Host ""
            Write-Host "  -----------------------------------------" -ForegroundColor DarkGray
            $next = Read-Host "  登录完成！是否立即启动服务？(Y/N)"
            if ($next -match "^[Yy]") {
                $shouldStart = $true
                break
            }

            $more = Read-Host "  是否继续登录其他 AI 账号？(Y/N)"
            if ($more -notmatch "^[Yy]") { break }
        }

        if ($shouldStart) {
            Start-Gateway
        }
    }
}
