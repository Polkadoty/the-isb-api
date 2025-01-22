# PowerShell script to run Node.js commands in order

# Run unitTester.js with -all flag
Start-Process -File "node" -ArgumentList "unitTester.js -all" -Wait

# Run jsoncombiner.js with -all flag
Start-Process -File "node" -ArgumentList "jsoncombiner.js -all" -Wait

# Run generateAliases.js
Start-Process -File "node" -ArgumentList "generateAliases.js" -Wait

# Run generateThumbnails.js
Start-Process -File "node" -ArgumentList "generateThumbnails.js" -Wait

# Run findErrata.js
Start-Process -File "node" -ArgumentList "find-errata.js" -Wait

# Run findNicknames.js
Start-Process -File "node" -ArgumentList "find-nicknames.js" -Wait
