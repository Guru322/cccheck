const express = require('express');
const axios = require('axios');
const app = express();
const port = 3000;

app.use(express.json());

app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bulk Domain to Country</title>
    <style>
        body { font-family: sans-serif; max-width: 800px; margin: 2rem auto; padding: 0 1rem; }
        textarea { width: 100%; height: 150px; margin-bottom: 1rem; padding: 10px; }
        button { cursor: pointer; padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 4px; font-size: 16px; }
        button:disabled { background: #ccc; }
        button.copy-btn { background: #28a745; font-size: 12px; padding: 5px 10px; margin-left: 10px; }
        
        .status-bar { margin: 10px 0; font-weight: bold; color: #555; }
        
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; word-break: break-all; }
        th { background-color: #f2f2f2; }
        
        .th-content { display: flex; justify-content: space-between; align-items: center; }
    </style>
</head>
<body>
    <h1>Bulk URL/Domain to Country Lookup</h1>
    <p>Paste full URLs or domains below.</p>
    
    <textarea id="domainInput" placeholder="https://www.google.com/search&#10;bbc.co.uk"></textarea>
    
    <button id="submitBtn" onclick="processDomains()">Get Countries</button>
    <div id="status" class="status-bar"></div>

    <table id="resultTable">
        <thead>
            <tr>
                <th>
                    <div class="th-content">
                        Original Input
                        <button class="copy-btn" onclick="copyColumn(0)">Copy Column</button>
                    </div>
                </th>
                <th>
                    <div class="th-content">
                        Country 
                        <button class="copy-btn" onclick="copyColumn(1)">Copy Column</button>
                    </div>
                </th>
            </tr>
        </thead>
        <tbody id="tableBody"></tbody>
    </table>

    <script>
        async function processDomains() {
            const input = document.getElementById('domainInput').value;
            const statusDiv = document.getElementById('status');
            const tableBody = document.getElementById('tableBody');
            const btn = document.getElementById('submitBtn');

            // Clean input by splitting newlines
            const domains = input.split('\\n').map(d => d.trim()).filter(d => d);

            if (domains.length === 0) return alert("Please enter domains");

            btn.disabled = true;
            tableBody.innerHTML = ''; 
            
            for (let i = 0; i < domains.length; i++) {
                const domain = domains[i];
                statusDiv.innerText = \`Processing \${i + 1} / \${domains.length}...\`;

                try {
                    const response = await fetch('/api/lookup', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ domain })
                    });
                    const data = await response.json();
                    
                    const row = \`<tr><td>\${data.original}</td><td>\${data.country}</td></tr>\`;
                    tableBody.innerHTML += row;
                    
                } catch (e) {
                    const row = \`<tr><td>\${domain}</td><td style="color:red">Error</td></tr>\`;
                    tableBody.innerHTML += row;
                }
            }

            statusDiv.innerText = "Done!";
            btn.disabled = false;
        }

        function copyColumn(colIndex) {
            const table = document.getElementById("resultTable");
            let textToCopy = "";
            for (let i = 1; i < table.rows.length; i++) {
                textToCopy += table.rows[i].cells[colIndex].innerText + "\\n";
            }
            navigator.clipboard.writeText(textToCopy).then(() => {
                alert("Column copied!");
            });
        }
    </script>
</body>
</html>
  `);
});

app.post('/api/lookup', async (req, res) => {
    const rawInput = req.body.domain;
    let lookupDomain = rawInput;

    // --- Clean the URL to get just the hostname ---
    try {
        let tempUrl = rawInput.startsWith('http') ? rawInput : 'http://' + rawInput;
        const parsedUrl = new URL(tempUrl);
        lookupDomain = parsedUrl.hostname;
    } catch (e) {
        lookupDomain = rawInput;
    }

    // Rate limit buffer
    await new Promise(resolve => setTimeout(resolve, 1500)); 

    try {
        const response = await axios.get(`http://ip-api.com/json/${lookupDomain}?fields=country`);
        
        let detectedCountry = response.data.country || "Unknown";

        if (detectedCountry === "Canada") {
            detectedCountry = "United States";
        }

        res.json({ 
            original: rawInput, 
            country: detectedCountry
        });
    } catch (error) {
        res.status(500).json({ original: rawInput, country: "Error" });
    }
});

app.listen(port, () => {
    console.log(`App updated. Restarted at http://localhost:3000`);
});
