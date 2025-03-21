document.addEventListener("DOMContentLoaded", function () {
  // Cache DOM elements
  const elements = {
    uploadZone: document.querySelector(".upload-zone"),
    webLinkInput: document.querySelector(".web-link-input"),
    actionButton: document.querySelector(".action-button"),
    feedbackSection: document.querySelector(".feedback-section"),
    previewImage: document.getElementById("preview-image"),
    resultsSection: document.getElementById("results"),
    analysisResults: document.getElementById("analysis-results"),
    submitFeedbackBtn: document.querySelector(".submit-feedback-btn"),
    userComment: document.getElementById("user-comment"),
    contentContainer: document.querySelector(".content-container"),
    ratingSlider: document.getElementById("rating-slider"),
    sliderValue: document.querySelector(".slider-value"),
  };

  // Track current image for analysis
  let currentImage = {
    file: null,
    url: null,
    name: null,
  };

  // Initialize state
  if (elements.feedbackSection) {
    elements.feedbackSection.style.display = "none";
  }

  if (elements.resultsSection) {
    elements.resultsSection.style.display = "none";
  }

  // Event listeners for file upload zone
  if (elements.uploadZone) {
    elements.uploadZone.addEventListener("dragover", (e) => {
      e.preventDefault();
      e.stopPropagation();
      elements.uploadZone.classList.add("drag-over");
    });

    elements.uploadZone.addEventListener("dragleave", (e) => {
      e.preventDefault();
      e.stopPropagation();
      elements.uploadZone.classList.remove("drag-over");
    });

    elements.uploadZone.addEventListener("drop", (e) => {
      e.preventDefault();
      e.stopPropagation();
      elements.uploadZone.classList.remove("drag-over");
      const file = e.dataTransfer.files[0];
      if (file) handleImageFile(file);
    });

    elements.uploadZone.addEventListener("click", () => {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*";
      input.onchange = (e) => {
        const file = e.target.files[0];
        if (file) handleImageFile(file);
      };
      input.click();
    });
  }

  // URL input handler
  if (elements.webLinkInput) {
    elements.webLinkInput.addEventListener("change", () => {
      const url = elements.webLinkInput.value.trim();
      if (url) {
        handleImageUrl(url);
      }
    });

    // Handle Enter key press
    elements.webLinkInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        const url = elements.webLinkInput.value.trim();
        if (url) {
          handleImageUrl(url);
        }
      }
    });
  }

  // Event listener for fetch/analyze button
  if (elements.actionButton) {
    elements.actionButton.addEventListener("click", () => {
      if (currentImage.file) {
        analyzeImageFile(currentImage.file);
      } else if (currentImage.url) {
        analyzeImageUrl(currentImage.url);
      } else {
        const url = elements.webLinkInput.value.trim();
        if (url) {
          handleImageUrl(url);
          analyzeImageUrl(url);
        } else {
          showError("Please provide an image or URL first");
        }
      }
    });
  }

  // Replace star rating functionality with slider
  if (elements.ratingSlider) {
    elements.ratingSlider.addEventListener("input", (e) => {
      if (elements.sliderValue) {
        elements.sliderValue.textContent = e.target.value;
      }
    });
  }

  // Feedback submission handler
  if (elements.submitFeedbackBtn) {
    elements.submitFeedbackBtn.addEventListener("click", submitFeedback);
  }

  // Helper Functions
  function handleImageFile(file) {
    // Validate file type and size
    const validTypes = ["image/jpeg", "image/png", "image/gif"];
    if (!validTypes.includes(file.type)) {
      showError("Please upload a valid image file (JPEG, PNG, or GIF)");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showError("File size should not exceed 5MB");
      return;
    }

    // Store the file for later analysis
    currentImage = {
      file: file,
      url: null,
      name: file.name,
    };

    // Display the image immediately
    displayImage(file);
    // Reset URL input
    if (elements.webLinkInput) {
      elements.webLinkInput.value = '';
    }
  }

  function handleImageUrl(url) {
    // Validate URL
    try {
      new URL(url);
    } catch (e) {
      showError("Please enter a valid URL");
      return;
    }

    // Store the URL for later analysis
    currentImage = {
      file: null,
      url: url,
      name: extractFilenameFromUrl(url),
    };

    // Display the image immediately
    displayImageFromUrl(url);
    // Reset URL input after processing
    if (elements.webLinkInput) {
      elements.webLinkInput.value = '';
    }
  }

  function displayImage(file) {
    if (!elements.previewImage || !elements.resultsSection) return;

    // Create object URL for the file
    const objectUrl = URL.createObjectURL(file);

    // Show the preview section and image
    elements.resultsSection.style.display = "block";
    elements.resultsSection.style.opacity = "1";
    elements.previewImage.style.display = "block";
    elements.previewImage.src = objectUrl;

    // Hide analysis results until analysis is performed
    if (elements.analysisResults) {
      elements.analysisResults.innerHTML =
        '<div class="placeholder">Click "Fetch data" to analyze this image</div>';
    }

    // Hide feedback section until analysis is complete
    if (elements.feedbackSection) {
      elements.feedbackSection.style.display = "none";
    }

    if (elements.contentContainer) {
      elements.contentContainer.classList.add("with-preview");
    }
  }

  function displayImageFromUrl(url) {
    if (!elements.previewImage || !elements.resultsSection) return;

    // Show the preview section and image
    elements.resultsSection.style.display = "block";
    elements.resultsSection.style.opacity = "1";
    elements.previewImage.style.display = "block";
    elements.previewImage.src = url;

    // Hide analysis results until analysis is performed
    if (elements.analysisResults) {
      elements.analysisResults.innerHTML =
        '<div class="placeholder">Click "Fetch data" to analyze this image</div>';
    }

    // Hide feedback section until analysis is complete
    if (elements.feedbackSection) {
      elements.feedbackSection.style.display = "none";
    }

    if (elements.contentContainer) {
      elements.contentContainer.classList.add("with-preview");
    }
  }

  function analyzeImageFile(file) {
    // Create FormData and append file
    const formData = new FormData();
    formData.append("image", file);

    // Set loading state
    setLoadingState(true);

    // Send to server for analysis
    fetch("/analyze", {
      method: "POST",
      body: formData,
    })
      .then(handleResponse)
      .then((data) => {
        handleAnalysisResult(data);
        setLoadingState(false);
      })
      .catch(handleError);
  }

  function analyzeImageUrl(url) {
    // Set loading state
    setLoadingState(true);

    // Send URL for analysis
    fetch("/analyze", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: `url=${encodeURIComponent(url)}`,
    })
      .then(handleResponse)
      .then((data) => {
        handleAnalysisResult(data);
        setLoadingState(false);
      })
      .catch(handleError);
  }

  function handleResponse(response) {
    if (!response.ok) {
      return response.json().then((data) => {
        throw new Error(data.error || "Server error occurred");
      });
    }
    return response.json();
  }

  function handleError(error) {
    console.error("Error:", error);
    showError(error.message || "An unexpected error occurred");
    setLoadingState(false);

    // Hide feedback section on error
    if (elements.feedbackSection) {
      elements.feedbackSection.style.display = "none";
    }
  }

  function showError(message) {
    if (elements.analysisResults) {
      elements.analysisResults.innerHTML = `
                <div class="error-message">
                    <p><strong>Error:</strong> ${message}</p>
                    <p>Please try again or contact support if the problem persists.</p>
                </div>`;

      // Make sure results section is visible when showing error
      if (elements.resultsSection) {
        elements.resultsSection.style.display = "block";
      }

      // Hide feedback section when showing errors
      if (elements.feedbackSection) {
        elements.feedbackSection.style.display = "none";
      }
    } else {
      alert(message);
    }
  }

  function setLoadingState(isLoading) {
    if (elements.actionButton) {
      elements.actionButton.disabled = isLoading;
      elements.actionButton.textContent = isLoading
        ? "Processing..."
        : "Fetch data";
    }

    if (isLoading && elements.analysisResults) {
      elements.analysisResults.innerHTML =
        '<div class="loading">Analyzing image...</div>';

      // Hide feedback section during loading
      if (elements.feedbackSection) {
        elements.feedbackSection.style.display = "none";
      }
    }
  }

  function handleAnalysisResult(data) {
    if (!elements.analysisResults) {
      console.error("Required DOM elements not found");
      return;
    }

    if (data.error) {
      showError(data.error);
      return;
    }

    // Update image name from server response if provided
    if (data.name && elements.previewImage) {
      elements.previewImage.dataset.imageName = data.name;
    }

    // Clear and update analysis results
    elements.analysisResults.innerHTML = "";

    // Create and append analysis text
    const analysisTextElement = document.createElement("div");
    analysisTextElement.className = "analysis-text";

    if (data.ai_output) {
      // Save analysis data to JSON file
      saveAnalysisData(data);
      analysisTextElement.innerHTML = `<p>${data.ai_output}</p>`;

      // Only show feedback section when AI output is available
      if (elements.feedbackSection) {
        elements.feedbackSection.style.display = "block";
        resetAndUpdateFeedback(data);
      }
    } else {
      analysisTextElement.innerHTML = "<p>No analysis results available.</p>";
      // Hide feedback section when no AI output
      if (elements.feedbackSection) {
        elements.feedbackSection.style.display = "none";
      }
    }

    elements.analysisResults.appendChild(analysisTextElement);
  }

  function saveAnalysisData(data) {
    try {
      fetch("/save-analysis", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: data.name,
          ai_output: data.ai_output,
          file_path: data.image_file_path,
          rating: null,
          comment: null,
        }),
      })
        .then(handleResponse)
        .catch((error) => console.error("Error saving analysis:", error));
    } catch (error) {
      console.error("Error saving analysis:", error);
    }
  }

  function resetAndUpdateFeedback(data) {
    if (!elements.feedbackSection) return;

    // Reset slider to default or existing value
    if (elements.ratingSlider) {
      elements.ratingSlider.value = data.rating || 0;
      if (elements.sliderValue) {
        elements.sliderValue.textContent = data.rating || 0;
      }
    }

    if (elements.userComment) {
      elements.userComment.value = data.comment || "";
    }
  }

  function submitFeedback() {
    if (!elements.submitFeedbackBtn || !elements.previewImage) return;

    const rating = elements.ratingSlider
      ? parseInt(elements.ratingSlider.value)
      : 0;
    const comment = elements.userComment ? elements.userComment.value : "";
    const imageName = elements.previewImage.dataset.imageName;

    if (!imageName) {
      showError("No image analysis found to rate");
      return;
    }

    // Disable button during submission
    elements.submitFeedbackBtn.disabled = true;
    elements.submitFeedbackBtn.textContent = "Submitting...";

    fetch("/submit-feedback", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        image_name: imageName,
        rating: rating,
        comment: comment,
      }),
    })
      .then(handleResponse)
      .then((data) => {
        alert("Thank you for your feedback!");
        window.location.reload(); // Add page refresh here
      })
      .catch((error) => {
        console.error("Error:", error);
        alert(`Failed to submit feedback: ${error.message}`);
      })
      .finally(() => {
        // Re-enable button after submission
        elements.submitFeedbackBtn.disabled = false;
        elements.submitFeedbackBtn.textContent = "Submit Feedback";
      });
  }

  function extractFilenameFromUrl(url) {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      const filename = pathname.substring(pathname.lastIndexOf("/") + 1);
      return filename || "image-from-url";
    } catch (e) {
      return "image-from-url";
    }
  }
});
