// Override business registration form to remove NIP requirement
(function() {
    'use strict';
    
    console.log('🔧 Business Registration Override loaded');
    
    // Function to override form validation
    function overrideFormValidation() {
        // Find NIP field and make it optional
        const nipField = document.querySelector('input[name="nip"], input[placeholder*="NIP"], input[id*="nip"]');
        if (nipField) {
            console.log('✅ Found NIP field, making it optional');
            nipField.removeAttribute('required');
            nipField.setAttribute('placeholder', 'NIP (opcjonalne)');
            
            // Remove asterisk from label
            const nipLabel = document.querySelector('label[for="' + nipField.id + '"]');
            if (nipLabel) {
                nipLabel.textContent = nipLabel.textContent.replace('*', '');
            }
        }
        
        // Override form submission
        const form = document.querySelector('form');
        if (form) {
            console.log('✅ Found form, overriding submission');
            form.addEventListener('submit', function(e) {
                e.preventDefault();
                
                // Get form data
                const formData = new FormData(form);
                const data = Object.fromEntries(formData.entries());
                
                // Make NIP optional
                if (!data.nip || data.nip.trim() === '') {
                    delete data.nip;
                }
                
                // Submit to our backend (mock for now)
                console.log('🚀 Submitting business registration:', data);
                
                // Mock successful registration
                alert('✅ Firma została pomyślnie zarejestrowana bez wymogu NIP!');
                
                return false;
            });
        }
    }
    
    // Run when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', overrideFormValidation);
    } else {
        overrideFormValidation();
    }
    
    // Also run periodically in case form is loaded dynamically
    setInterval(overrideFormValidation, 2000);
    
})();
