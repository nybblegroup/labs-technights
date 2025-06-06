#eynar.pari@nybblegroup.com
https://github.com/microsoft/playwright-mcp

configure the setting.json and add the mcp config

{
    "chat.mcp.discovery.enabled": true,
    "mcp": {
        "servers": {
            "playwright": {
                "command": "npx",
                "args": [
                    "@playwright/mcp@latest"
                ]
            }
        }
    },
    "github.copilot.chat.languageContext.fix.typescript.enabled": true,
    "github.copilot.chat.languageContext.inline.typescript.enabled": true,
    "github.copilot.chat.languageContext.typescript.enabled": true,
    "github.copilot.nextEditSuggestions.enabled": true
}


