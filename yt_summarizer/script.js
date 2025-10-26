document.getElementById('generate-btn').addEventListener('click', async function() {
    const url = document.getElementById('youtube-url').value.trim();
    const outputDiv = document.getElementById('output');
    outputDiv.style.display = 'block';
    outputDiv.textContent = '';

    if (!url || !/^https:\/\/(www\.)?youtube\.com\/watch\?v=/.test(url)) {
        outputDiv.textContent = 'Please enter a valid YouTube video URL.';
        return;
    }

    outputDiv.textContent = 'Generating summary...';
    try {
        const response = await fetch('https://slanderously-panniered-corbin.ngrok-free.dev/webhook-test/572bcd14-1d14-42ee-845c-76e6bad61647', 
            {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ url })
        });
        if (!response.ok) {
            throw new Error('Server error: ' + response.status);
        }
        const data = await response.json();
        // Expecting the summary in data.summary or similar
        outputDiv.textContent = data.summary || JSON.stringify(data);
    } catch (err) {
        outputDiv.textContent = 'Error: ' + err.message;
    }
});
