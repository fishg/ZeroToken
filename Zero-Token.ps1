[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
$Host.UI.RawUI.WindowTitle = "Zero-Token"

$Providers = @(
    @{ Num= 1; Id="deepseek-web";   Label="DeepSeek";          Site="chat.deepseek.com" }
    @{ Num= 2; Id="qwen-web";       Label="Qwen";              Site="chat.qwen.ai" }
    @{ Num= 3; Id="qwen-cn-web";    Label="Qwen CN";           Site="chat2.qianwen.com" }
    @{ Num= 4; Id="doubao-web";     Label="Doubao";             Site="www.doubao.com" }
    @{ Num= 5; Id="kimi-web";       Label="Kimi";               Site="www.kimi.com" }
    @{ Num= 6; Id="glm-web";        Label="GLM";                Site="chatglm.cn" }
    @{ Num= 7; Id="chatgpt-web";    Label="ChatGPT";            Site="chatgpt.com" }
    @{ Num= 8; Id="claude-web";     Label="Claude";             Site="claude.ai" }
    @{ Num= 9; Id="gemini-web";     Label="Gemini";             Site="gemini.google.com" }
    @{ Num=10; Id="grok-web";       Label="Grok";               Site="grok.com" }
    @{ Num=11; Id="perplexity-web"; Label="Perplexity";         Site="www.perplexity.ai" }
    @{ Num=12; Id="xiaomimo-web";   Label="XiaoMi MiMo";        Site="aistudio.xiaomimimo.com" }
    @{ Num=13; Id="glm-intl-web";   Label="GLM International";  Site="chat.z.ai" }
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
    Write-Host "  ---- 开始安装 ----" -ForegroundColor Yellow
    Write-Host ""

    if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
        Write-Host "  [x] 未检测到 Node.js，请先安装 Node.js 22+" -ForegroundColor Red
        Write-Host "      https://nodejs.org/" -ForegroundColor Gray
        return $false
    }

    $projectDir = $PSScriptRoot

    Write-Host "  [1/5] 安装项目依赖..." -ForegroundColor Cyan
    Push-Location $projectDir
    & npm install --silent 2>&1 | Out-Null
    Pop-Location
    Write-Host "  [ok] 完成" -ForegroundColor Green

    Write-Host "  [2/5] 构建插件..." -ForegroundColor Cyan
    Push-Location $projectDir
    & node build.mjs 2>&1 | Out-Null
    Pop-Location
    if (-not (Test-Path (Join-Path $projectDir "dist\index.js"))) {
        Write-Host "  [x] 构建失败" -ForegroundColor Red
        return $false
    }
    Write-Host "  [ok] 完成" -ForegroundColor Green

    Write-Host "  [3/5] 部署插件..." -ForegroundColor Cyan
    $extDir = Join-Path $env:USERPROFILE ".openclaw\extensions\zero-token"
    $extDist = Join-Path $extDir "dist"
    if (-not (Test-Path $extDist)) { New-Item -ItemType Directory -Path $extDist -Force | Out-Null }
    Copy-Item (Join-Path $projectDir "dist\index.js") $extDist -Force
    Copy-Item (Join-Path $projectDir "package.json") $extDir -Force
    Copy-Item (Join-Path $projectDir "openclaw.plugin.json") $extDir -Force
    Write-Host "  [ok] 完成" -ForegroundColor Green

    Write-Host "  [4/5] 安装插件运行时依赖..." -ForegroundColor Cyan
    Push-Location $extDir
    & npm install --omit=dev --silent 2>&1 | Out-Null
    Pop-Location
    Write-Host "  [ok] 完成" -ForegroundColor Green

    Write-Host "  [5/5] 打补丁..." -ForegroundColor Cyan
    Push-Location $projectDir
    & node patch-registry.js 2>&1
    Pop-Location
    Write-Host ""
    Write-Host "  ---- 安装完成 ----" -ForegroundColor Green
    return $true
}

function Start-Gateway {
    Clear-Host
    Write-Host ""
    Write-Host "  正在启动 Zero-Token 服务..." -ForegroundColor Cyan
    Write-Host ""
    Write-Host "  网址:  http://127.0.0.1:18789/" -ForegroundColor White
    Write-Host "  关闭此窗口即可停止服务" -ForegroundColor Gray
    Write-Host ""

    Start-Process powershell -ArgumentList "-NoProfile -Command Start-Sleep 8; Start-Process http://127.0.0.1:18789/" -WindowStyle Hidden

    & $OpenClawCmd gateway run

    Write-Host ""
    Write-Host "  服务已停止。" -ForegroundColor Yellow
    Read-Host "  按回车退出"
    exit 0
}

# ══════════════════════════════════════
# 前置检查
# ══════════════════════════════════════
if (-not $OpenClawCmd) {
    Write-Banner
    Write-Host "  [x] 未检测到 OpenClaw" -ForegroundColor Red
    Write-Host "  请先安装: npm install -g openclaw" -ForegroundColor Yellow
    Write-Host ""
    Read-Host "  按回车退出"
    exit 1
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
