# Сборка и установка приложения

Инструкция для этого проекта в Windows PowerShell 5.1 или PowerShell 7. Java, Node.js и зависимости проекта должны быть установлены. Если папки `node_modules` нет, сначала выполните `npm ci` в папке проекта.

Подключите один телефон по USB, включите «Отладку по USB», разблокируйте телефон и разрешите отладку с этого компьютера. Для обновления используйте прежний ключ `android/app/finance-release.keystore` и его пароли.

Скопируйте **весь блок целиком** в PowerShell. После ввода пароля хранилища команда покажет существующие ключи; введите нужный alias из этого списка. Пароли вводятся скрыто. Если пароль ключа совпадает с паролем хранилища, на соответствующем запросе нажмите Enter.

```powershell
& {
    $ErrorActionPreference = 'Stop'
    Set-Location 'C:\Users\amang\Documents\ChatGPT\Finance'

    $env:ANDROID_HOME = 'C:\Users\amang\AppData\Local\Android\Sdk'
    $env:ANDROID_SDK_ROOT = $env:ANDROID_HOME
    $env:FINANCE_KEYSTORE_PATH = Join-Path (Get-Location).Path 'android\app\finance-release.keystore'

    $financeAdbPath = Join-Path $env:ANDROID_HOME 'platform-tools\adb.exe'
    $financeApkPath = Join-Path (Get-Location).Path 'android\app\build\outputs\apk\release\app-release.apk'

    Get-Command java.exe, node.exe, keytool.exe -ErrorAction Stop | Out-Null
    foreach ($financeRequiredPath in @($financeAdbPath, $env:FINANCE_KEYSTORE_PATH, '.\android\gradlew.bat', '.\android\app\google-services.json', '.\node_modules')) {
        if (-not (Test-Path -LiteralPath $financeRequiredPath)) {
            throw "Не найден обязательный файл или каталог: $financeRequiredPath"
        }
    }

    & $financeAdbPath devices
    if ($LASTEXITCODE -ne 0) { throw 'Не удалось получить список устройств ADB.' }
    $financeDeviceState = & $financeAdbPath get-state
    if ($LASTEXITCODE -ne 0 -or "$financeDeviceState".Trim() -ne 'device') {
        throw 'Нужен один доступный телефон. Проверьте USB, разрешение отладки на телефоне и отключите другие устройства ADB.'
    }

    try {
        $financeStorePassword = Read-Host 'Пароль хранилища finance-release.keystore' -AsSecureString
        try {
            $env:FINANCE_KEYSTORE_PASSWORD = [System.Net.NetworkCredential]::new('', $financeStorePassword).Password
        } finally {
            $financeStorePassword.Dispose()
        }

        & keytool.exe -list -keystore $env:FINANCE_KEYSTORE_PATH -storepass:env FINANCE_KEYSTORE_PASSWORD
        if ($LASTEXITCODE -ne 0) { throw 'Не удалось открыть хранилище. Проверьте его пароль.' }

        $env:FINANCE_KEY_ALIAS = (Read-Host 'Alias существующего ключа из списка выше').Trim()
        if (-not $env:FINANCE_KEY_ALIAS) { throw 'Alias ключа не должен быть пустым.' }

        $financeKeyPassword = Read-Host 'Пароль ключа (Enter — тот же, что у хранилища)' -AsSecureString
        try {
            if ($financeKeyPassword.Length -eq 0) {
                $env:FINANCE_KEY_PASSWORD = $env:FINANCE_KEYSTORE_PASSWORD
            } else {
                $env:FINANCE_KEY_PASSWORD = [System.Net.NetworkCredential]::new('', $financeKeyPassword).Password
            }
        } finally {
            $financeKeyPassword.Dispose()
        }

        .\android\gradlew.bat -p .\android assembleRelease
        if ($LASTEXITCODE -ne 0) { throw 'Сборка завершилась ошибкой. Установка отменена.' }
        if (-not (Test-Path -LiteralPath $financeApkPath -PathType Leaf)) {
            throw "После сборки APK не найден: $financeApkPath"
        }

        & $financeAdbPath install -r $financeApkPath
        if ($LASTEXITCODE -ne 0) { throw 'ADB не смог установить APK. Причина указана выше в выводе команды.' }

        Write-Host 'Приложение собрано и обновлено на телефоне.'
        Write-Host "APK: $financeApkPath"
    } finally {
        Remove-Item Env:\FINANCE_KEYSTORE_PASSWORD, Env:\FINANCE_KEY_PASSWORD -ErrorAction SilentlyContinue
    }
}
```

При ошибке сборки установка не запускается, поэтому старый APK случайно не установится. Команда `install -r` обновляет приложение с сохранением его данных при совпадающей подписи; удалять установленное приложение не требуется.

Пароли не сохраняются в README или истории команд PowerShell. На время сборки они передаются через переменные окружения, которые очищаются в конце блока, в том числе при ошибке. При следующей сборке снова скопируйте весь блок и введите пароли. Новое окно PowerShell не наследует настройки, сделанные в предыдущем окне.
