// booking.js - Padelcamp Booking System

class PadelcampBooking {
  constructor() {
    this.selectedCamp = null;
    this.selectedRoomType = null;
    this.currentPrice = 0;
    this.apiBaseUrl = '/api'; // Same domain as frontend
    
    this.initEventListeners();
  }

  initEventListeners() {
    // Camp Selection
    document.querySelectorAll('input[name="selectedCamp"]').forEach(input => {
      input.addEventListener('change', this.handleCampSelection.bind(this));
    });

    // Room Type Selection  
    document.querySelectorAll('input[name="roomType"]').forEach(input => {
      input.addEventListener('change', this.handleRoomTypeSelection.bind(this));
    });

    // Form Inputs
    document.querySelectorAll('#customerInfo input, #customerInfo select').forEach(input => {
      input.addEventListener('input', this.validateForm.bind(this));
      input.addEventListener('change', this.validateForm.bind(this));
    });

    // Proceed to Payment Button
    document.getElementById('proceedToPayment')?.addEventListener('click', this.proceedToPayment.bind(this));

    // Update existing booking buttons
    this.updateExistingBookingButtons();

    // Modal reset on close
    const bookingModal = document.getElementById('bookingModal');
    if (bookingModal) {
      bookingModal.addEventListener('hidden.bs.modal', this.resetForm.bind(this));
    }
  }

  updateExistingBookingButtons() {
    // Ersetze bestehende "Jetzt buchen" Links mit Modal-Trigger
    document.querySelectorAll('a[href*="eversports.ch"]').forEach(link => {
      link.href = '#';
      link.setAttribute('data-bs-toggle', 'modal');
      link.setAttribute('data-bs-target', '#bookingModal');
      
      // Optional: Vorauswahl basierend auf dem geklickten Camp
      const campTitle = link.closest('.card')?.querySelector('.card-title')?.textContent;
      if (campTitle) {
        const campId = this.getCampIdFromTitle(campTitle);
        if (campId) {
          link.addEventListener('click', () => {
            setTimeout(() => this.preselectCamp(campId), 100);
          });
        }
      }
    });
  }

  preselectCamp(campId) {
    const campInput = document.getElementById(`camp-${campId}`);
    if (campInput) {
      campInput.checked = true;
      campInput.dispatchEvent(new Event('change'));
    }
  }

  getCampIdFromTitle(title) {
    if (!title) return null;
    if (title.includes('11.-14.09')) return 'sept-1';
    if (title.includes('18.-21.09')) return 'sept-2';
    if (title.includes('10.-13.10')) return 'oct-1';
    if (title.includes('17.-20.10')) return 'oct-2';
    if (title.includes('24.-27.10')) return 'oct-3';
    return null;
  }

  handleCampSelection(event) {
    const campOption = event.target.closest('.camp-option');
    if (!campOption) return;
    
    const campId = event.target.value;
    const singlePrice = parseInt(campOption.dataset.priceSingle);
    const doublePrice = parseInt(campOption.dataset.priceDouble);

    // Remove previous selections
    document.querySelectorAll('.camp-option').forEach(option => {
      option.classList.remove('selected');
    });
    
    // Mark current as selected
    campOption.classList.add('selected');

    this.selectedCamp = {
      id: campId,
      name: event.target.nextElementSibling.querySelector('strong').textContent,
      singlePrice: singlePrice,
      doublePrice: doublePrice
    };

    // Update price display
    const singlePriceEl = document.getElementById('singlePrice');
    const doublePriceEl = document.getElementById('doublePrice');
    if (singlePriceEl) singlePriceEl.textContent = `CHF ${singlePrice}`;
    if (doublePriceEl) doublePriceEl.textContent = `CHF ${doublePrice}`;

    // Show room selection
    const roomSelection = document.getElementById('roomSelection');
    if (roomSelection) roomSelection.style.display = 'block';
    
    // Reset room type selection
    document.querySelectorAll('input[name="roomType"]').forEach(input => {
      input.checked = false;
    });
    
    // Hide subsequent sections
    const customerInfo = document.getElementById('customerInfo');
    const bookingSummary = document.getElementById('bookingSummary');
    if (customerInfo) customerInfo.style.display = 'none';
    if (bookingSummary) bookingSummary.style.display = 'none';
    
    this.validateForm();
  }

  handleRoomTypeSelection(event) {
    this.selectedRoomType = event.target.value;
    this.currentPrice = event.target.value === 'single' ? 
      this.selectedCamp.singlePrice : 
      this.selectedCamp.doublePrice;

    // Show customer info form
    const customerInfo = document.getElementById('customerInfo');
    if (customerInfo) customerInfo.style.display = 'block';
    
    this.updateSummary();
    this.validateForm();
  }

  updateSummary() {
    if (!this.selectedCamp || !this.selectedRoomType) return;

    const summaryContent = document.getElementById('summaryContent');
    const totalPriceEl = document.getElementById('totalPrice');
    const bookingSummary = document.getElementById('bookingSummary');
    
    if (!summaryContent || !totalPriceEl || !bookingSummary) return;

    const roomTypeText = this.selectedRoomType === 'single' ? 'Einzelzimmer' : 'Doppelzimmer';
    
    summaryContent.innerHTML = `
      <p class="mb-1"><strong>Camp:</strong> ${this.selectedCamp.name}</p>
      <p class="mb-1"><strong>Zimmer:</strong> ${roomTypeText}</p>
    `;

    totalPriceEl.textContent = `CHF ${this.currentPrice}`;
    bookingSummary.style.display = 'block';
  }

  validateForm() {
    const firstName = document.getElementById('firstName')?.value.trim() || '';
    const lastName = document.getElementById('lastName')?.value.trim() || '';
    const email = document.getElementById('email')?.value.trim() || '';
    const country = document.getElementById('country')?.value || '';
    const agbAccept = document.getElementById('agbAccept')?.checked || false;

    const isValid = this.selectedCamp && 
                   this.selectedRoomType && 
                   firstName.length > 0 && 
                   lastName.length > 0 && 
                   this.isValidEmail(email) && 
                   country.length > 0 && 
                   agbAccept;

    const button = document.getElementById('proceedToPayment');
    if (button) {
      button.disabled = !isValid;
      
      // Visual feedback
      if (isValid) {
        button.classList.remove('btn-secondary');
        button.classList.add('btn-primary');
      } else {
        button.classList.remove('btn-primary');
        button.classList.add('btn-secondary');
      }
    }
  }

  isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  async proceedToPayment() {
    console.log('🚀 Starting payment process...');
    
    if (!this.validatePaymentData()) {
      alert('Bitte füllen Sie alle Pflichtfelder aus.');
      return;
    }

    try {
      // Show loading modal
      const loadingModal = new bootstrap.Modal(document.getElementById('loadingModal'));
      loadingModal.show();

      // Prepare payment data
      const paymentData = this.preparePaymentData();
      
      console.log('💳 Payment data prepared:', paymentData);
      
      // Initialize payment with backend
      const response = await fetch(`${this.apiBaseUrl}/payment/init`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(paymentData)
      });

      console.log('📡 Response status:', response.status);
      
      const result = await response.json();
      console.log('📋 Payment response:', result);

      loadingModal.hide();

      if (result.success) {
        console.log('✅ Payment initialization successful');
        
        // Close booking modal
        const bookingModal = bootstrap.Modal.getInstance(document.getElementById('bookingModal'));
        if (bookingModal) {
          bookingModal.hide();
        }

        // Small delay for modal animation
        setTimeout(() => {
          console.log('🔄 Redirecting to Datatrans:', result.lightboxUrl);
          window.location.href = result.lightboxUrl;
        }, 300);
        
      } else {
        throw new Error(result.error || 'Payment initialization failed');
      }

    } catch (error) {
      console.error('❌ Payment Error:', error);
      
      // Hide loading modal
      const loadingModal = bootstrap.Modal.getInstance(document.getElementById('loadingModal'));
      if (loadingModal) loadingModal.hide();

      let errorMessage = 'Es ist ein Fehler aufgetreten.';
      
      if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
        errorMessage = 'Verbindung zum Server fehlgeschlagen. Läuft der Server?';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      // Show user-friendly error
      alert(errorMessage + '\n\nÖffnen Sie die Konsole (F12) für weitere Details.');
    }
  }

  validatePaymentData() {
    const firstName = document.getElementById('firstName')?.value.trim();
    const lastName = document.getElementById('lastName')?.value.trim();
    const email = document.getElementById('email')?.value.trim();
    const country = document.getElementById('country')?.value;
    const agbAccept = document.getElementById('agbAccept')?.checked;

    return this.selectedCamp && 
           this.selectedRoomType && 
           firstName && 
           lastName && 
           this.isValidEmail(email) && 
           country && 
           agbAccept;
  }

  preparePaymentData() {
    const firstName = document.getElementById('firstName').value.trim();
    const lastName = document.getElementById('lastName').value.trim();
    const email = document.getElementById('email').value.trim();
    const phone = document.getElementById('phone')?.value.trim() || '';
    const country = document.getElementById('country').value;

    // Generate unique order ID
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    const orderId = `PADEL-${timestamp}-${random}`;

    return {
      amount: this.currentPrice,
      currency: 'CHF',
      orderId: orderId,
      campName: this.selectedCamp.name,
      customerEmail: email,
      customerName: `${firstName} ${lastName}`,
      customerData: {
        firstName: firstName,
        lastName: lastName,
        email: email,
        phone: phone,
        country: country,
        campId: this.selectedCamp.id,
        roomType: this.selectedRoomType
      }
    };
  }

  resetForm() {
    console.log('🔄 Resetting booking form...');
    
    // Reset form fields
    const form = document.getElementById('bookingForm');
    if (form) form.reset();
    
    // Hide sections
    const sections = ['roomSelection', 'customerInfo', 'bookingSummary'];
    sections.forEach(sectionId => {
      const section = document.getElementById(sectionId);
      if (section) section.style.display = 'none';
    });
    
    // Remove camp selections
    document.querySelectorAll('.camp-option').forEach(option => {
      option.classList.remove('selected');
    });
    
    // Reset button
    const button = document.getElementById('proceedToPayment');
    if (button) {
      button.disabled = true;
      button.classList.remove('btn-primary');
      button.classList.add('btn-secondary');
    }
    
    // Reset properties
    this.selectedCamp = null;
    this.selectedRoomType = null;
    this.currentPrice = 0;
  }
}

// Initialize booking system when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  console.log('🎯 Initializing Padelcamp Booking System...');
  
  // Only initialize if booking elements exist
  const bookingModal = document.getElementById('bookingModal');
  if (!bookingModal) {
    console.log('ℹ️  Booking modal not found - skipping initialization');
    return;
  }
  
  const booking = new PadelcampBooking();
  
  // Test server connection
  fetch('/health')
    .then(response => response.json())
    .then(data => {
      console.log('✅ Server connection successful:', data);
      
      if (!data.datatrans.configured) {
        console.warn('⚠️  Datatrans not fully configured - check .env file');
      }
    })
    .catch(error => {
      console.error('❌ Server not reachable:', error);
      console.log('💡 Make sure to start the server with: node backend/server.js');
    });
});

// Add booking styles
const bookingStyles = `
<style>
.camp-option {
  transition: all 0.3s ease;
  cursor: pointer;
  border: 2px solid #e9ecef !important;
}

.camp-option:hover {
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  transform: translateY(-2px);
  border-color: #2E7D32 !important;
}

.camp-option.selected {
  border-color: #2E7D32 !important;
  background-color: #f8f9fa !important;
  box-shadow: 0 4px 12px rgba(46, 125, 50, 0.2);
}

.camp-option .form-check-input:checked {
  background-color: #2E7D32;
  border-color: #2E7D32;
}

.form-check-input:checked + .form-check-label {
  color: #2E7D32;
}

#loadingModal .modal-content {
  border: none;
  box-shadow: 0 4px 20px rgba(0,0,0,0.15);
  border-radius: 15px;
}

.spinner-border {
  width: 3rem;
  height: 3rem;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background-color: #2E7D32;
  border-color: #2E7D32;
}

.btn-primary:hover {
  background-color: #1B5E20;
  border-color: #1B5E20;
}

.badge {
  font-size: 0.75em;
}

.form-control:focus,
.form-select:focus {
  border-color: #2E7D32;
  box-shadow: 0 0 0 0.2rem rgba(46, 125, 50, 0.25);
}

#bookingSummary {
  border-left: 4px solid #2E7D32;
}

@media (max-width: 768px) {
  .camp-option {
    margin-bottom: 1rem;
  }
  
  .modal-dialog {
    margin: 0.5rem;
  }
  
  .modal-body {
    padding: 1rem;
  }
}

/* Animation for section reveals */
#roomSelection,
#customerInfo,
#bookingSummary {
  animation: fadeInUp 0.3s ease-out;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
`;

document.head.insertAdjacentHTML('beforeend', bookingStyles);

// Debug helper
window.PadelcampBooking = PadelcampBooking;