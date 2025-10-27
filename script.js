// Global State
let flashcards = [];
let currentCardIndex = 0;
let uploadedFile = null;

// DOM Elements
const textTab = document.querySelector('[data-tab="text"]');
const fileTab = document.querySelector('[data-tab="file"]');
const textTabContent = document.getElementById('text-tab');
const fileTabContent = document.getElementById('file-tab');
const textInput = document.getElementById('text-input');
const fileInput = document.getElementById('file-input');
const fileDropZone = document.getElementById('file-drop-zone');
const fileInfo = document.getElementById('file-info');
const fileName = document.getElementById('file-name');
const fileSize = document.getElementById('file-size');
const removeFileBtn = document.getElementById('remove-file-btn');
const cardCountInput = document.getElementById('card-count');
const generateBtn = document.getElementById('generate-btn');
const loading = document.getElementById('loading');
const flashcardsSection = document.getElementById('flashcards-section');
const flashcard = document.getElementById('flashcard');
const questionText = document.getElementById('question-text');
const answerText = document.getElementById('answer-text');
const currentCardSpan = document.getElementById('current-card');
const totalCardsSpan = document.getElementById('total-cards');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const shuffleBtn = document.getElementById('shuffle-btn');
const downloadBtn = document.getElementById('download-btn');

// Tab Switching
textTab.addEventListener('click', () => switchTab('text'));
fileTab.addEventListener('click', () => switchTab('file'));

function switchTab(tab) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    
    if (tab === 'text') {
        textTab.classList.add('active');
        textTabContent.classList.add('active');
    } else {
        fileTab.classList.add('active');
        fileTabContent.classList.add('active');
    }
}

// File Upload Handling
fileDropZone.addEventListener('click', () => fileInput.click());

fileDropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    fileDropZone.classList.add('drag-over');
});

fileDropZone.addEventListener('dragleave', () => {
    fileDropZone.classList.remove('drag-over');
});

fileDropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    fileDropZone.classList.remove('drag-over');
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        handleFileSelect(files[0]);
    }
});

fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        handleFileSelect(e.target.files[0]);
    }
});

removeFileBtn.addEventListener('click', () => {
    uploadedFile = null;
    fileInput.value = '';
    fileInfo.style.display = 'none';
    fileDropZone.style.display = 'block';
});

function handleFileSelect(file) {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    if (!allowedTypes.includes(file.type)) {
        alert('Please upload a PDF or Word document (.pdf, .doc, .docx)');
        return;
    }

    if (file.size > maxSize) {
        alert('File size must be less than 10MB');
        return;
    }

    uploadedFile = file;
    fileName.textContent = file.name;
    fileSize.textContent = formatFileSize(file.size);
    fileDropZone.style.display = 'none';
    fileInfo.style.display = 'flex';
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

// Convert file to base64
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            // Remove the data URL prefix (e.g., "data:application/pdf;base64,")
            const base64String = reader.result.split(',')[1];
            resolve(base64String);
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
    });
}

// Generate Flashcards
generateBtn.addEventListener('click', async () => {
    const activeTab = document.querySelector('.tab-btn.active').dataset.tab;
    const cardCount = parseInt(cardCountInput.value) || 5;

    if (cardCount < 1 || cardCount > 50) {
        alert('Please enter a number between 1 and 50');
        return;
    }

    let content = '';
    
    if (activeTab === 'text') {
        content = textInput.value.trim();
        if (!content) {
            alert('Please enter some text to generate flashcards');
            return;
        }
    } else {
        if (!uploadedFile) {
            alert('Please upload a file');
            return;
        }
    }

    // Show loading state
    generateBtn.disabled = true;
    loading.style.display = 'block';
    flashcardsSection.style.display = 'none';

    // Update loading message to indicate it may take time
    const loadingMessage = loading.querySelector('p');
    const originalMessage = loadingMessage.textContent;
    let dots = 0;
    const loadingInterval = setInterval(() => {
        dots = (dots + 1) % 4;
        loadingMessage.textContent = originalMessage + '.'.repeat(dots);
    }, 500);

    // Send data to webhook
    try {
        const webhookUrl = 'https://slanderously-panniered-corbin.ngrok-free.dev/webhook-test/310fc425-b8ef-433d-972f-67a6687b61f8';
        
        let payload;
        
        if (activeTab === 'text') {
            // Send text content
            payload = {
                content: content,
                cardCount: cardCount,
                timestamp: new Date().toISOString(),
                source: activeTab
            };
        } else {
            // Convert file to base64 and send in binary structure
            const base64File = await fileToBase64(uploadedFile);
            payload = {
                binary: {
                    file: {
                        data: base64File,
                        fileName: uploadedFile.name,
                        mimeType: uploadedFile.type,
                        fileSize: uploadedFile.size
                    }
                },
                cardCount: cardCount,
                timestamp: new Date().toISOString(),
                source: activeTab
            };
        }

        console.log('Sending request to webhook...');
        
        // Create an AbortController but with a very long timeout (5 minutes)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 300000); // 5 minutes

        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
            signal: controller.signal,
            keepalive: true
        });

        clearTimeout(timeoutId);

        console.log('Response status:', response.status);
        console.log('Response headers:', response.headers);

        // Try to get response body even if status is not OK
        const responseText = await response.text();
        console.log('Raw response:', responseText);

        if (!response.ok) {
            console.error(`Webhook returned status ${response.status}. Response body:`, responseText);
            // Try to parse the error response
            try {
                const errorData = JSON.parse(responseText);
                console.error('Error details:', errorData);
            } catch (e) {
                console.error('Could not parse error response as JSON');
            }
            throw new Error(`Webhook returned status ${response.status}: ${responseText.substring(0, 200)}`);
        }
        
        const result = JSON.parse(responseText);
        console.log('Parsed result:', result);
        
        // Parse the webhook response - handle array format with nested JSON string
        if (Array.isArray(result) && result.length > 0 && result[0].output) {
            console.log('Processing array format with output field');
            // Parse the nested JSON string from the output field
            const parsedOutput = JSON.parse(result[0].output);
            console.log('Parsed output:', parsedOutput);
            if (parsedOutput.flashcards && Array.isArray(parsedOutput.flashcards)) {
                flashcards = parsedOutput.flashcards;
                console.log('Flashcards loaded:', flashcards.length);
            } else {
                throw new Error('Invalid flashcards format in response');
            }
        } else if (result && result.flashcards && Array.isArray(result.flashcards)) {
            console.log('Processing direct flashcards format');
            // Direct flashcards format
            flashcards = result.flashcards;
            console.log('Flashcards loaded:', flashcards.length);
        } else {
            console.error('Unexpected response format:', result);
            throw new Error('No flashcards found in response');
        }
        
        clearInterval(loadingInterval);
        loadingMessage.textContent = originalMessage;
        
        displayFlashcards();
        
        generateBtn.disabled = false;
        loading.style.display = 'none';
        flashcardsSection.style.display = 'block';
        
        // Scroll to flashcards
        flashcardsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        
    } catch (error) {
        clearInterval(loadingInterval);
        loadingMessage.textContent = originalMessage;
        
        console.error('Error sending to webhook:', error);
        
        if (error.name === 'AbortError') {
            alert('The request took too long (over 5 minutes). Please try with a smaller file or less flashcards.');
        } else {
            alert('Error connecting to the server: ' + error.message + '\n\nGenerating flashcards locally instead.');
        }
        
        // Fallback to local generation on error
        if (activeTab === 'file') {
            try {
                content = await extractTextFromFile(uploadedFile);
            } catch (extractError) {
                alert('Error reading file: ' + extractError.message);
                generateBtn.disabled = false;
                loading.style.display = 'none';
                return;
            }
        }
        flashcards = generateFlashcardsFromText(content, cardCount);
        displayFlashcards();
        
        generateBtn.disabled = false;
        loading.style.display = 'none';
        flashcardsSection.style.display = 'block';
        
        flashcardsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
});

async function extractTextFromFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = async (e) => {
            const arrayBuffer = e.target.result;
            
            if (file.type === 'application/pdf') {
                // For PDF files - in a real app, you'd use a library like pdf.js
                // For this demo, we'll simulate text extraction
                resolve(simulatePDFExtraction(file.name));
            } else {
                // For Word documents - in a real app, you'd use a library like mammoth.js
                // For this demo, we'll simulate text extraction
                resolve(simulateDocxExtraction(file.name));
            }
        };
        
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsArrayBuffer(file);
    });
}

function simulatePDFExtraction(filename) {
    // Simulated text extraction - in production, use pdf.js or similar
    return `Sample content from ${filename}. 
    
    Artificial Intelligence (AI) is intelligence demonstrated by machines, as opposed to the natural intelligence displayed by humans and animals. Leading AI textbooks define the field as the study of "intelligent agents": any device that perceives its environment and takes actions that maximize its chance of successfully achieving its goals.
    
    Machine learning is a subset of AI that provides systems the ability to automatically learn and improve from experience without being explicitly programmed. It focuses on the development of computer programs that can access data and use it to learn for themselves.
    
    Deep learning is part of a broader family of machine learning methods based on artificial neural networks with representation learning. Learning can be supervised, semi-supervised or unsupervised.`;
}

function simulateDocxExtraction(filename) {
    // Simulated text extraction - in production, use mammoth.js or similar
    return `Sample content from ${filename}.
    
    Cloud computing is the delivery of computing services including servers, storage, databases, networking, software, analytics, and intelligence over the Internet ("the cloud") to offer faster innovation, flexible resources, and economies of scale.
    
    Types of cloud computing include Infrastructure as a Service (IaaS), Platform as a Service (PaaS), and Software as a Service (SaaS). Each type provides different levels of control, flexibility, and management.
    
    Benefits of cloud computing include cost savings, scalability, performance, speed, productivity, reliability, and security.`;
}

function generateFlashcardsFromText(text, count) {
    // This is a simplified version. In production, you'd use an AI API like OpenAI
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20);
    const cards = [];
    
    // Generate questions based on content
    const patterns = [
        { question: 'What is {}?', extract: /([A-Z][a-z]+(?: [A-Z][a-z]+)*) is/g },
        { question: 'Define {}.', extract: /([A-Z][a-z]+(?: [A-Z][a-z]+)*) (?:is|are)/g },
        { question: 'What does {} refer to?', extract: /([A-Z][a-z]+(?: [A-Z][a-z]+)*) (?:refers to|means)/g },
    ];
    
    let generatedCount = 0;
    
    for (let i = 0; i < sentences.length && generatedCount < count; i++) {
        const sentence = sentences[i].trim();
        if (sentence.length < 30) continue;
        
        // Try to extract key terms
        const words = sentence.split(' ');
        if (words.length > 5) {
            // Create question from sentence
            const question = createQuestionFromSentence(sentence, generatedCount);
            const answer = sentence.trim();
            
            cards.push({ question, answer });
            generatedCount++;
        }
    }
    
    // Fill remaining cards with general questions if needed
    while (cards.length < count) {
        cards.push({
            question: `What is a key concept from the text? (Card ${cards.length + 1})`,
            answer: sentences[cards.length % sentences.length].trim() || 'No additional content available.'
        });
    }
    
    return cards;
}

function createQuestionFromSentence(sentence, index) {
    const questionStarters = [
        'What does the text say about',
        'Explain the concept of',
        'What is the key point regarding',
        'Describe',
        'What can you tell me about',
        'Define the term',
        'What is meant by',
        'Summarize the information about'
    ];
    
    // Extract first few words or key terms
    const words = sentence.split(' ');
    const keyPhrase = words.slice(0, 3).join(' ').replace(/[,.:;]/g, '');
    
    const starter = questionStarters[index % questionStarters.length];
    return `${starter} "${keyPhrase}..."?`;
}

function displayFlashcards() {
    if (flashcards.length === 0) return;
    
    currentCardIndex = 0;
    totalCardsSpan.textContent = flashcards.length;
    showCard(currentCardIndex);
}

function showCard(index) {
    if (flashcards.length === 0) return;
    
    // Remove flip state
    flashcard.classList.remove('flipped');
    
    // Update content
    questionText.textContent = flashcards[index].question;
    answerText.textContent = flashcards[index].answer;
    
    // Update counter
    currentCardSpan.textContent = index + 1;
    
    // Update navigation buttons
    prevBtn.disabled = index === 0;
    nextBtn.disabled = index === flashcards.length - 1;
}

// Flashcard Flip
flashcard.addEventListener('click', () => {
    flashcard.classList.toggle('flipped');
});

// Navigation
prevBtn.addEventListener('click', () => {
    if (currentCardIndex > 0) {
        currentCardIndex--;
        showCard(currentCardIndex);
    }
});

nextBtn.addEventListener('click', () => {
    if (currentCardIndex < flashcards.length - 1) {
        currentCardIndex++;
        showCard(currentCardIndex);
    }
});

// Keyboard navigation
document.addEventListener('keydown', (e) => {
    if (flashcardsSection.style.display === 'none') return;
    
    if (e.key === 'ArrowLeft') {
        prevBtn.click();
    } else if (e.key === 'ArrowRight') {
        nextBtn.click();
    } else if (e.key === ' ') {
        e.preventDefault();
        flashcard.click();
    }
});

// Shuffle Cards
shuffleBtn.addEventListener('click', () => {
    flashcards = shuffleArray([...flashcards]);
    currentCardIndex = 0;
    showCard(currentCardIndex);
});

function shuffleArray(array) {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
}

// Download Flashcards
downloadBtn.addEventListener('click', () => {
    const dataStr = JSON.stringify(flashcards, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `flashcards-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
});

// Input Validation
cardCountInput.addEventListener('input', (e) => {
    const value = parseInt(e.target.value);
    if (value < 1) e.target.value = 1;
    if (value > 50) e.target.value = 50;
});

// Mobile optimizations
let touchStartX = 0;
let touchEndX = 0;

flashcard.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
}, { passive: true });

flashcard.addEventListener('touchend', (e) => {
    touchEndX = e.changedTouches[0].screenX;
    handleSwipe();
}, { passive: true });

function handleSwipe() {
    const swipeThreshold = 50;
    const diff = touchStartX - touchEndX;
    
    if (Math.abs(diff) > swipeThreshold) {
        if (diff > 0) {
            // Swipe left - next card
            nextBtn.click();
        } else {
            // Swipe right - previous card
            prevBtn.click();
        }
    }
}
