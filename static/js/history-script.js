document.addEventListener('DOMContentLoaded', function() {
    // Cache DOM elements
    const editModal = document.getElementById('editModal');
    const editForm = document.getElementById('editForm');
    const editImageName = document.getElementById('editImageName');
    const editRating = document.getElementById('editRating');
    const editComment = document.getElementById('editComment');
    const editRatingValue = document.getElementById('editRatingValue');
    const closeBtn = document.querySelector('.close');
    const cancelBtn = document.querySelector('.cancel-btn');

    // Functions
    window.editEntry = function(btn) {
        const row = btn.closest('tr');
        const ratingEl = row.querySelector('.rating-value');
        const commentEl = row.querySelector('.comment-value');
        
        editImageName.value = row.dataset.id;
        editRating.value = ratingEl ? parseInt(ratingEl.textContent) : 0;
        editRatingValue.textContent = editRating.value;
        editComment.value = commentEl ? commentEl.textContent : '';
        
        editModal.style.display = 'block';
    }

    window.deleteEntry = function(btn) {
        if (confirm('Are you sure you want to delete this entry?')) {
            const row = btn.closest('tr');
            const imageName = row.dataset.id;
            
            fetch('/delete-analysis', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ image_name: imageName })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    location.reload();  // Replace row.remove() with page refresh
                } else {
                    alert('Error deleting entry: ' + data.error);
                }
            })
            .catch(error => alert('Error: ' + error));
        }
    }

    // Event Listeners
    editForm.onsubmit = function(e) {
        e.preventDefault();
        const imageName = editImageName.value;
        const rating = editRating.value;
        const comment = editComment.value;

        fetch('/edit-analysis', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                image_name: imageName,
                rating: parseInt(rating),
                comment: comment
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                location.reload();
            } else {
                alert('Error updating entry: ' + data.error);
            }
        })
        .catch(error => alert('Error: ' + error));
    };

    editRating.oninput = function() {
        editRatingValue.textContent = this.value;
    };

    // Modal close handlers
    closeBtn.onclick = function() {
        editModal.style.display = 'none';
    };
    
    cancelBtn.onclick = function() {
        editModal.style.display = 'none';
    };

    // Close modal when clicking outside
    window.onclick = function(event) {
        if (event.target === editModal) {
            editModal.style.display = 'none';
        }
    };
});
