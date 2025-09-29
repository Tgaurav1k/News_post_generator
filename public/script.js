// DOM elements
const headlineInput = document.getElementById('headline');
const countInput = document.getElementById('count');
const generateBtn = document.getElementById('generate-btn');
const styleSelect = document.getElementById('style-select');
const gallery = document.getElementById('gallery');
const gallerySection = document.getElementById('gallery-section');
const loader = document.getElementById('loader');
const toast = document.getElementById('toast');
const selectionCounter = document.getElementById('selection-counter');

// State
let generatedImages = [];
let selectedImages = new Set();

// Enable/disable generate button based on headline input
headlineInput.addEventListener('input', () => {
    generateBtn.disabled = !headlineInput.value.trim();
});

// Handle generate button click
generateBtn.addEventListener('click', async () => {
    const headline = headlineInput.value.trim();
    const count = parseInt(countInput.value);
    const style = styleSelect ? styleSelect.value : 'realistic';

    if (!headline) {
        showToast('Please enter a headline', 'error');
        return;
    }

    if (count < 1 || count > 9) {
        showToast('Please select between 1 and 9 images', 'error');
        return;
    }

    await generateImages(headline, count, style);
});

// Generate images
async function generateImages(headline, count, style) {
    // Show loader, hide gallery, disable controls
    loader.style.display = 'block';
    gallerySection.style.display = 'none';
    generateBtn.disabled = true;
    headlineInput.disabled = true;
    countInput.disabled = true;
    
    // Reset state
    generatedImages = [];
    selectedImages.clear();
    gallery.innerHTML = '';

    try {
        const t0 = performance.now();
        console.log('[CLIENT] POST /api/generate →', { headline, count, style });
        const response = await fetch('/api/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                headline,
                count,
                style
            })
        });
        const elapsedMs = Math.round(performance.now() - t0);
        console.log('[CLIENT] /api/generate status:', response.status, response.statusText, `in ${elapsedMs}ms`);

        let data;
        try {
            data = await response.json();
        } catch (e) {
            const text = await response.text();
            console.warn('[CLIENT] Non-JSON response:', text);
            throw new Error('Server returned non-JSON response');
        }

        if (!response.ok) {
            console.error('[CLIENT] /api/generate error payload:', data);
            const details = Array.isArray(data?.details) ? `Details: ${data.details.join(' | ')}` : '';
            throw new Error(data?.error ? `${data.error}${details ? ' — ' + details : ''}` : 'Failed to generate images');
        }

        console.log('[CLIENT] /api/generate success payload:', data);
        generatedImages = data.images;

        // Display images
        displayImages(generatedImages, headline);
        updateCounter();
        
        showToast(`Successfully generated ${count} images!`, 'success');
    } catch (error) {
        console.error('Generation error:', error);
        console.log('[CLIENT] Env hints →', {
            location: window.location.href,
            time: new Date().toISOString(),
            userAgent: navigator.userAgent
        });
        showToast(error.message || 'Failed to generate images. Please try again.', 'error');
    } finally {
        loader.style.display = 'none';
        generateBtn.disabled = false;
        headlineInput.disabled = false;
        countInput.disabled = false;
    }
}

// Display images in gallery
function displayImages(images, headline) {
    gallery.innerHTML = '';
    
    images.forEach((imageData, index) => {
        const card = createImageCard(imageData, index, headline);
        gallery.appendChild(card);
    });

    gallerySection.style.display = 'block';
}

// Create image card element
function createImageCard(imageData, index, headline) {
    const card = document.createElement('div');
    card.className = 'image-card';
    card.dataset.index = index;

    const imageWrapper = document.createElement('div');
    imageWrapper.className = 'image-wrapper';

    const img = document.createElement('img');
    img.src = imageData.url;
    img.alt = `Generated Instagram post concept ${index + 1} for headline: ${headline}`;
    img.loading = 'lazy';
    imageWrapper.appendChild(img);

    const actions = document.createElement('div');
    actions.className = 'card-actions';

    const checkboxWrapper = document.createElement('div');
    checkboxWrapper.className = 'checkbox-wrapper';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = `select-${index}`;
    checkbox.addEventListener('change', (e) => {
        handleSelection(index, e.target.checked);
    });

    const label = document.createElement('label');
    label.htmlFor = `select-${index}`;
    label.textContent = 'Select';

    checkboxWrapper.appendChild(checkbox);
    checkboxWrapper.appendChild(label);

    const downloadBtn = document.createElement('button');
    downloadBtn.className = 'btn-download';
    downloadBtn.textContent = 'Download';
    downloadBtn.addEventListener('click', () => downloadImage(imageData.url, index));

    actions.appendChild(checkboxWrapper);
    actions.appendChild(downloadBtn);

    card.appendChild(imageWrapper);
    card.appendChild(actions);

    return card;
}

// Handle image selection
function handleSelection(index, isSelected) {
    const card = document.querySelector(`[data-index="${index}"]`);
    
    if (isSelected) {
        selectedImages.add(index);
        card.classList.add('selected');
    } else {
        selectedImages.delete(index);
        card.classList.remove('selected');
    }
    
    updateCounter();
}

// Update selection counter
function updateCounter() {
    selectionCounter.textContent = `Selected: ${selectedImages.size}/${generatedImages.length}`;
}

// Download image
async function downloadImage(url, index) {
    try {
        const response = await fetch(url);
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = `instagram-post-${index + 1}-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        URL.revokeObjectURL(blobUrl);
        showToast('Image downloaded successfully!', 'success');
    } catch (error) {
        console.error('Download error:', error);
        showToast('Failed to download image', 'error');
    }
}

// Show toast notification
function showToast(message, type = 'error') {
    toast.textContent = message;
    toast.className = `toast ${type}`;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 4000);
}

// Initialize
generateBtn.disabled = true;