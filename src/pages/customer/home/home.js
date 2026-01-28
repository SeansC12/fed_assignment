      lucide.createIcons();

      // Modal functionality
      document.addEventListener("DOMContentLoaded", () => {
        // Open modal
        document.querySelectorAll("[data-modal]").forEach((button) => {
          button.addEventListener("click", () => {
            const modalId = button.getAttribute("data-modal");
            const modal = document.getElementById(modalId);
            if (modal) {
              modal.classList.add("show");
            }
          });
        });

        // Close modal
        document.querySelectorAll("[data-close-modal]").forEach((button) => {
          button.addEventListener("click", () => {
            const modalId = button.getAttribute("data-close-modal");
            const modal = document.getElementById(modalId);
            if (modal) {
              // If Reset button, select first radio option
              if (button.classList.contains("secondary")) {
                const firstRadio = modal.querySelector('input[type="radio"]');
                if (firstRadio) firstRadio.checked = true;
              }

              modal.classList.remove("show");

              // Update capsule text if Apply or Reset button
              if (
                button.classList.contains("primary") ||
                button.classList.contains("secondary")
              ) {
                updateCapsuleText(modalId);
              }
            }
          });
        });

        // Close modal on overlay click
        document.querySelectorAll(".modal-overlay").forEach((overlay) => {
          overlay.addEventListener("click", (e) => {
            if (e.target === overlay) {
              overlay.classList.remove("show");
            }
          });
        });

        // Toggle filter active state
        document
          .querySelectorAll(".filter-capsule:not([data-modal])")
          .forEach((button) => {
            button.addEventListener("click", () => {
              button.classList.toggle("active");
            });
          });

        // Function to update capsule text based on selection
        function updateCapsuleText(modalId) {
          const modal = document.getElementById(modalId);
          const selectedRadio = modal.querySelector(
            'input[type="radio"]:checked',
          );

          if (!selectedRadio) return;

          const selectedText = selectedRadio.nextElementSibling.textContent;
          const capsule = document.querySelector(`[data-modal="${modalId}"]`);
          const textSpan = capsule.querySelector(".filter-capsule-icon");

          // Get filter name from modal title
          const filterName = modal.querySelector(".modal-title").textContent;

          // Check if it's the default/first option (usually "All" or "Recommended")
          const isDefault =
            selectedRadio.value ===
            modal.querySelectorAll('input[type="radio"]')[0].value;

          if (isDefault) {
            // Reset to original text and remove active class
            textSpan.innerHTML = `${filterName}<i data-lucide="chevron-down" class="w-4 h-4"></i>`;
            capsule.classList.remove("active");
          } else {
            // Show selected option and add active class
            textSpan.innerHTML = `${filterName}: ${selectedText}<i data-lucide="chevron-down" class="w-4 h-4"></i>`;
            capsule.classList.add("active");
          }

          lucide.createIcons();
        }

        // Re-init lucide icons after modal interaction
        setTimeout(() => lucide.createIcons(), 100);
      });