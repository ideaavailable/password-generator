// ========================================
// Password Generator - Main Script
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const passwordText = document.getElementById('passwordText');
    const copyBtn = document.getElementById('copyBtn');
    const copyTooltip = document.getElementById('copyTooltip');
    const refreshBtn = document.getElementById('refreshBtn');
    const generateBtn = document.getElementById('generateBtn');
    const lengthSlider = document.getElementById('lengthSlider');
    const lengthValue = document.getElementById('lengthValue');
    const lengthMinus = document.getElementById('lengthMinus');
    const lengthPlus = document.getElementById('lengthPlus');
    const sliderFill = document.getElementById('sliderFill');
    const strengthBar = document.getElementById('strengthBar');
    const strengthLabel = document.getElementById('strengthLabel');
    const strengthDetail = document.getElementById('strengthDetail');
    const toggleUppercase = document.getElementById('toggleUppercase');
    const toggleNumbers = document.getElementById('toggleNumbers');
    const toggleSymbols = document.getElementById('toggleSymbols');
    const multiHeader = document.getElementById('multiHeader');
    const multiList = document.getElementById('multiList');
    const multiChevron = document.querySelector('.multi-chevron');

    // Character sets
    const CHAR_SETS = {
        lowercase: 'abcdefghijklmnopqrstuvwxyz',
        uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
        numbers: '0123456789',
        symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?'
    };

    // State
    let isMultiOpen = false;

    // ========================================
    // Secure Random Number Generation
    // ========================================
    function getSecureRandom(max) {
        const array = new Uint32Array(1);
        crypto.getRandomValues(array);
        return array[0] % max;
    }

    // ========================================
    // Password Generation
    // ========================================
    function generatePassword(length) {
        const useUppercase = toggleUppercase.checked;
        const useNumbers = toggleNumbers.checked;
        const useSymbols = toggleSymbols.checked;

        // Build character pool
        let pool = CHAR_SETS.lowercase;
        const required = [];

        if (useUppercase) {
            pool += CHAR_SETS.uppercase;
            // Ensure at least one uppercase letter
            required.push(CHAR_SETS.uppercase[getSecureRandom(CHAR_SETS.uppercase.length)]);
        }
        if (useNumbers) {
            pool += CHAR_SETS.numbers;
            required.push(CHAR_SETS.numbers[getSecureRandom(CHAR_SETS.numbers.length)]);
        }
        if (useSymbols) {
            pool += CHAR_SETS.symbols;
            required.push(CHAR_SETS.symbols[getSecureRandom(CHAR_SETS.symbols.length)]);
        }

        // Always include at least one lowercase
        required.push(CHAR_SETS.lowercase[getSecureRandom(CHAR_SETS.lowercase.length)]);

        if (pool.length === 0) {
            pool = CHAR_SETS.lowercase;
        }

        // Generate password
        let password = '';
        const remainingLength = Math.max(length - required.length, 0);

        // Fill remaining slots with random characters
        for (let i = 0; i < remainingLength; i++) {
            password += pool[getSecureRandom(pool.length)];
        }

        // Insert required characters at random positions
        for (const char of required) {
            const pos = getSecureRandom(password.length + 1);
            password = password.slice(0, pos) + char + password.slice(pos);
        }

        // Trim to exact length
        return password.slice(0, length);
    }

    // ========================================
    // Password Strength Calculation
    // ========================================
    function calculateStrength(password) {
        const length = password.length;
        let poolSize = 0;

        if (/[a-z]/.test(password)) poolSize += 26;
        if (/[A-Z]/.test(password)) poolSize += 26;
        if (/[0-9]/.test(password)) poolSize += 10;
        if (/[^a-zA-Z0-9]/.test(password)) poolSize += 32;

        // Calculate entropy
        const entropy = length * Math.log2(poolSize || 1);

        // Estimate crack time (assuming 1 trillion guesses/sec)
        const combinations = Math.pow(poolSize || 1, length);
        const secondsToCrack = combinations / 1e12;

        let level, label, detail;

        if (entropy < 28) {
            level = 'weak';
            label = '弱い';
            detail = formatCrackTime(secondsToCrack);
        } else if (entropy < 50) {
            level = 'fair';
            label = '普通';
            detail = formatCrackTime(secondsToCrack);
        } else if (entropy < 70) {
            level = 'strong';
            label = '強い';
            detail = formatCrackTime(secondsToCrack);
        } else {
            level = 'very-strong';
            label = '非常に強い';
            detail = formatCrackTime(secondsToCrack);
        }

        return { level, label, detail };
    }

    function formatCrackTime(seconds) {
        if (seconds < 1) return '解読：一瞬';
        if (seconds < 60) return `解読に約${Math.ceil(seconds)}秒`;
        if (seconds < 3600) return `解読に約${Math.ceil(seconds / 60)}分`;
        if (seconds < 86400) return `解読に約${Math.ceil(seconds / 3600)}時間`;
        if (seconds < 31536000) return `解読に約${Math.ceil(seconds / 86400)}日`;
        
        const years = seconds / 31536000;
        if (years < 1000) return `解読に約${Math.ceil(years)}年`;
        if (years < 1e6) return `解読に約${Math.ceil(years / 1000)}千年`;
        if (years < 1e9) return `解読に約${Math.ceil(years / 1e6)}百万年`;
        if (years < 1e12) return `解読に約${Math.ceil(years / 1e9)}十億年`;
        return '解読は事実上不可能';
    }

    // ========================================
    // UI Updates
    // ========================================
    function updatePassword() {
        const length = parseInt(lengthSlider.value);
        const password = generatePassword(length);
        
        // Animate password change
        passwordText.classList.remove('password-change');
        void passwordText.offsetWidth; // Force reflow
        passwordText.classList.add('password-change');
        passwordText.textContent = password;

        // Update strength
        const strength = calculateStrength(password);
        updateStrengthUI(strength);

        // Update multi-passwords if open
        if (isMultiOpen) {
            generateMultiPasswords();
        }
    }

    function updateStrengthUI(strength) {
        // Update bar
        strengthBar.className = 'strength-bar ' + strength.level;
        
        // Update label
        strengthLabel.textContent = strength.label;
        strengthLabel.className = 'strength-label ' + strength.level;
        
        // Update detail
        strengthDetail.textContent = strength.detail;
    }

    function updateSliderFill() {
        const min = parseInt(lengthSlider.min);
        const max = parseInt(lengthSlider.max);
        const value = parseInt(lengthSlider.value);
        const percentage = ((value - min) / (max - min)) * 100;
        sliderFill.style.width = percentage + '%';
        lengthValue.textContent = value;
    }

    function generateMultiPasswords() {
        const length = parseInt(lengthSlider.value);
        multiList.innerHTML = '';
        
        for (let i = 0; i < 5; i++) {
            const pw = generatePassword(length);
            const item = document.createElement('div');
            item.className = 'multi-item';
            item.innerHTML = `
                <span class="multi-item-text">${escapeHtml(pw)}</span>
                <button class="multi-item-copy" title="コピー" aria-label="パスワードをコピー" data-password="${escapeHtml(pw)}">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                        <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
                    </svg>
                </button>
            `;
            multiList.appendChild(item);
        }

        // Add event listeners to copy buttons
        multiList.querySelectorAll('.multi-item-copy').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const pw = btn.dataset.password;
                copyToClipboard(pw);
                
                // Visual feedback
                btn.style.background = 'rgba(34, 197, 94, 0.2)';
                btn.style.borderColor = '#22c55e';
                btn.style.color = '#4ade80';
                setTimeout(() => {
                    btn.style.background = '';
                    btn.style.borderColor = '';
                    btn.style.color = '';
                }, 1000);
            });
        });
    }

    function escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    // ========================================
    // Clipboard
    // ========================================
    async function copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            showCopyTooltip();
        } catch {
            // Fallback
            const textArea = document.createElement('textarea');
            textArea.value = text;
            textArea.style.position = 'fixed';
            textArea.style.left = '-9999px';
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            showCopyTooltip();
        }
    }

    function showCopyTooltip() {
        copyTooltip.classList.add('show');
        setTimeout(() => {
            copyTooltip.classList.remove('show');
        }, 1500);
    }

    // ========================================
    // Background Particles
    // ========================================
    function createParticles() {
        const container = document.getElementById('bgParticles');
        const particleCount = 20;

        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            
            const size = Math.random() * 4 + 1;
            const left = Math.random() * 100;
            const duration = Math.random() * 15 + 10;
            const delay = Math.random() * 10;
            const opacity = Math.random() * 0.4 + 0.1;
            
            particle.style.width = size + 'px';
            particle.style.height = size + 'px';
            particle.style.left = left + '%';
            particle.style.animationDuration = duration + 's';
            particle.style.animationDelay = delay + 's';
            particle.style.opacity = opacity;
            
            container.appendChild(particle);
        }
    }

    // ========================================
    // Event Listeners
    // ========================================

    // Slider
    lengthSlider.addEventListener('input', () => {
        updateSliderFill();
        updatePassword();
    });

    // Plus/Minus buttons
    lengthMinus.addEventListener('click', () => {
        const val = parseInt(lengthSlider.value);
        if (val > parseInt(lengthSlider.min)) {
            lengthSlider.value = val - 1;
            updateSliderFill();
            updatePassword();
        }
    });

    lengthPlus.addEventListener('click', () => {
        const val = parseInt(lengthSlider.value);
        if (val < parseInt(lengthSlider.max)) {
            lengthSlider.value = val + 1;
            updateSliderFill();
            updatePassword();
        }
    });

    // Toggle switches
    [toggleUppercase, toggleNumbers, toggleSymbols].forEach(toggle => {
        toggle.addEventListener('change', () => {
            updatePassword();
        });
    });

    // Copy button
    copyBtn.addEventListener('click', () => {
        const password = passwordText.textContent;
        if (password && password !== '生成中...') {
            copyToClipboard(password);
            
            // Button animation
            copyBtn.style.background = 'rgba(34, 197, 94, 0.2)';
            copyBtn.style.borderColor = '#22c55e';
            copyBtn.style.color = '#4ade80';
            setTimeout(() => {
                copyBtn.style.background = '';
                copyBtn.style.borderColor = '';
                copyBtn.style.color = '';
            }, 1000);
        }
    });

    // Refresh button
    refreshBtn.addEventListener('click', () => {
        refreshBtn.style.transform = 'rotate(360deg)';
        setTimeout(() => {
            refreshBtn.style.transform = '';
        }, 400);
        updatePassword();
    });

    // Generate button
    generateBtn.addEventListener('click', () => {
        updatePassword();
    });

    // Multi-password toggle
    multiHeader.addEventListener('click', () => {
        isMultiOpen = !isMultiOpen;
        multiChevron.classList.toggle('open', isMultiOpen);
        multiList.classList.toggle('open', isMultiOpen);
        
        if (isMultiOpen) {
            generateMultiPasswords();
        }
    });

    // FAQ accordion
    document.querySelectorAll('.faq-question').forEach(question => {
        question.addEventListener('click', () => {
            const item = question.closest('.faq-item');
            const isOpen = item.classList.contains('open');
            
            // Close all
            document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('open'));
            
            // Toggle current
            if (!isOpen) {
                item.classList.add('open');
            }
        });
    });

    // Smooth scroll for nav links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            const href = link.getAttribute('href');
            if (href.startsWith('#')) {
                e.preventDefault();
                const target = document.querySelector(href);
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth' });
                }
                
                // Update active state
                document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
                link.classList.add('active');
            }
        });
    });

    // ========================================
    // Initialization
    // ========================================
    createParticles();
    updateSliderFill();
    updatePassword();
});
