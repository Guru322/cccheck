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
<title>Liquid Bulk Lookup</title>
<style>
    body {
        margin: 0;
        font-family: -apple-system, BlinkMacSystemFont, sans-serif;
        overflow: hidden;
        color: white;
    }
    
    /* Central Wrapper to hold both cards and apply the 3D tilt */
    #wrapper {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 800px;
        max-width: 90%;
        display: flex;
        flex-direction: column;
        gap: 20px;
        transition: transform 0.4s cubic-bezier(.2,.8,.2,1);
    }

    /* Glassmorphism styles */
    .glass-card {
        padding: 30px;
        border-radius: 25px;
        background: linear-gradient(135deg, rgba(255,255,255,0.25), rgba(255,255,255,0.05));
        backdrop-filter: blur(30px) saturate(180%);
        border: 1px solid rgba(255,255,255,0.4);
        box-shadow: inset 0 2px 2px rgba(255,255,255,0.5), 0 30px 60px rgba(0,0,0,0.5);
        position: relative;
        overflow: hidden;
    }

    /* Table styling and copy-column hover effects */
    th {
        cursor: pointer;
        transition: background 0.2s;
        padding: 10px;
    }
    th:hover {
        background: rgba(255,255,255,0.2);
        border-radius: 8px;
    }
    td {
        padding: 8px 10px;
        border-bottom: 1px solid rgba(255,255,255,0.1);
        word-break: break-all;
    }

    /* --- BEAUTIFUL SCROLLBAR CSS --- */
    
    /* Firefox */
    * {
        scrollbar-width: thin;
        scrollbar-color: rgba(255, 255, 255, 0.3) transparent;
    }

    /* Chrome, Edge, Safari */
    ::-webkit-scrollbar {
        width: 8px;
        height: 8px;
    }

    ::-webkit-scrollbar-track {
        background: transparent;
        border-radius: 10px;
    }

    ::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.3);
        border-radius: 10px;
    }

    ::-webkit-scrollbar-thumb:hover {
        background: rgba(255, 255, 255, 0.5);
    }
</style>
</head>

<body>

<div id="bg" style="
position:fixed;
inset:0;
background:url('https://picsum.photos/1920/1080?blur=2') center/cover no-repeat;
transform:scale(1.1);
transition:transform 0.2s;
"></div>


<div id="wrapper">
    <div id="shine" style="
    position:absolute;
    inset:0;
    border-radius:25px;
    background:radial-gradient(circle at center, rgba(255,255,255,0.6), transparent 60%);
    opacity:0.3;
    pointer-events:none;
    z-index: 10;
    "></div>

    <div class="glass-card">
        <h1 style="margin-top:0;">Bulk Domain Lookup</h1>
        <textarea id="domainInput"
        style="
        width:100%;
        height:150px;
        margin-bottom:15px;
        background:rgba(255,255,255,0.1);
        border:none;
        border-radius:15px;
        padding:10px;
        color:white;
        outline:none;
        resize:vertical;
        box-sizing: border-box;
        "></textarea>

        <button id="submitBtn"
        onclick="processDomains()"
        style="
        padding:12px 25px;
        border:none;
        border-radius:15px;
        background:rgba(255,255,255,0.2);
        color:white;
        cursor:pointer;
        transition:0.2s;
        "
        onmouseover="this.style.transform='scale(1.05)'"
        onmouseout="this.style.transform='scale(1)'"
        >
        Get Countries
        </button>

        <div id="status" style="margin-top:10px;"></div>
    </div>

    <div class="glass-card" style="max-height: 40vh; overflow-y: auto; padding-top: 15px; overflow-x: hidden;">
        <table id="resultTable"
        style="
        width:100%;
        border-collapse:collapse;
        background:rgba(255,255,255,0.05);
        border-radius:15px;
        overflow:hidden;
        ">
        <thead>
        <tr>
        <th onclick="copyColumn(0)" title="Click to copy all Inputs" style="width: 70%; text-align: left;">Input 📋</th>
        <th onclick="copyColumn(1)" title="Click to copy all Countries" style="width: 30%; text-align: left;">Country 📋</th>
        </tr>
        </thead>
        <tbody id="tableBody"></tbody>
        </table>
    </div>
</div>


<script>
const wrapper = document.getElementById("wrapper")
const shine = document.getElementById("shine")
const bg = document.getElementById("bg")

// 3D Tilt Effect on the whole wrapper
document.addEventListener("mousemove", e => {
    let x = e.clientX / window.innerWidth
    let y = e.clientY / window.innerHeight
    let rotateX = (y - 0.5) * 15
    let rotateY = (x - 0.5) * -15

    wrapper.style.transform =
    \`translate(-50%,-50%)
    rotateX(\${rotateX}deg)
    rotateY(\${rotateY}deg)
    scale(1.03)\`

    shine.style.background =
    \`radial-gradient(
    circle at \${x*100}% \${y*100}%,
    rgba(255,255,255,0.7),
    transparent 60%)\`

    bg.style.transform =
    \`scale(1.1)
    translate(\${x*-40}px,\${y*-40}px)\`
})

document.addEventListener("mouseleave", () => {
    wrapper.style.transform = "translate(-50%,-50%)"
})

// Logic to process domains
async function processDomains() {
    const input = document.getElementById('domainInput').value;
    const statusDiv = document.getElementById('status');
    const tableBody = document.getElementById('tableBody');
    const btn = document.getElementById('submitBtn');

    const domains = input.split('\\n').map(d => d.trim()).filter(d => d);

    if (domains.length === 0) return alert("enter domains");

    btn.disabled = true;
    tableBody.innerHTML = '';

    for (let i = 0; i < domains.length; i++) {
        const domain = domains[i];
        statusDiv.innerText = \`Processing \${i+1} / \${domains.length}\`

        try{
            const response = await fetch('/api/lookup',{
                method:'POST',
                headers:{'Content-Type':'application/json'},
                body:JSON.stringify({domain})
            })

            const data = await response.json()

            tableBody.innerHTML +=
            \`<tr>
            <td>\${data.original}</td>
            <td>\${data.country}</td>
            </tr>\`
        } catch {
            tableBody.innerHTML +=
            \`<tr>
            <td>\${domain}</td>
            <td>Error</td>
            </tr>\`
        }
    }

    statusDiv.innerText="Done"
    btn.disabled=false
}

// Logic to copy entire column
function copyColumn(colIndex) {
    const rows = document.querySelectorAll('#tableBody tr');
    if (rows.length === 0) return; // Nothing to copy

    let dataToCopy = [];
    rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        if (cells[colIndex]) {
            dataToCopy.push(cells[colIndex].innerText);
        }
    });

    const textToCopy = dataToCopy.join('\\n');
    
    navigator.clipboard.writeText(textToCopy).then(() => {
        const colName = colIndex === 0 ? 'Inputs' : 'Countries';
        alert(colName + ' copied to clipboard!');
    }).catch(err => {
        console.error('Failed to copy: ', err);
        alert('Failed to copy to clipboard.');
    });
}
</script>

</body>
</html>
`);
});

app.post('/api/lookup', async (req, res) => {
    const rawInput = req.body.domain || "";
    
    if (!rawInput) {
        return res.json({ original: "N/A", country: "Invalid Input" });
    }

    let lookupDomain = rawInput;

    try {
        let tempUrl = rawInput.startsWith('http')
            ? rawInput
            : 'http://' + rawInput;
        lookupDomain = new URL(tempUrl).hostname;
    } catch (error) {}

    await new Promise(r => setTimeout(r, 500));

    try {
        const response = await axios.get(
            `http://ip-api.com/json/${lookupDomain}?fields=country`
        );

        let resultCountry = response.data.country || "Unknown";
        
        if (resultCountry === "Canada") {
            resultCountry = "United States";
        }

        res.json({
            original: rawInput,
            country: resultCountry
        });

    } catch (error) {
        res.json({
            original: rawInput,
            country: "Error"
        });
    }
});

app.listen(port, '0.0.0.0', () => {  
    console.log(`Running on http://0.0.0.0:${port}`);  
});  
