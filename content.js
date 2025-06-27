// ✅ TEST: Confirm content.js injection
console.log("✅ TEST: content.js is loaded");

const testBanner = document.createElement('div');
testBanner.innerText = "✅ PhishGuard content.js injected";
testBanner.style.position = "fixed";
testBanner.style.top = "0";
testBanner.style.left = "0";
testBanner.style.width = "100%";
testBanner.style.backgroundColor = "green";
testBanner.style.color = "white";
testBanner.style.fontSize = "16px";
testBanner.style.textAlign = "center";
testBanner.style.zIndex = "9999";
testBanner.style.padding = "10px";
document.body.appendChild(testBanner);

// -------------------------
// PhishingDetector class
// -------------------------

class PhishingDetector {
  constructor() {
    this.isGmail = window.location.hostname.includes('gmail.com');
    this.isOutlook = window.location.hostname.includes('outlook');
    this.processedEmails = new Set();
    this.nlpModel = new EmailNLPAnalyzer();
    this.init();
  }

  init() {
    console.log('PhishGuard: Initializing...');
    this.setupMutationObserver();
    this.processExistingEmails();
  }

  setupMutationObserver() {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          this.processNewEmails();
        }
      });
    });

    observer.observe(document.body, { childList: true, subtree: true });
  }

  processExistingEmails() {
    setTimeout(() => this.processNewEmails(), 2000);
  }

  processNewEmails() {
    const emails = this.getEmailElements();
    emails.forEach(email => {
      const emailId = this.getEmailId(email);
      if (!this.processedEmails.has(emailId)) {
        this.processedEmails.add(emailId);
        this.analyzeEmail(email);
      }
    });
  }

  getEmailElements() {
    if (this.isGmail) {
      return document.querySelectorAll('[data-message-id], .adn, .ii.gt');
    } else if (this.isOutlook) {
      return document.querySelectorAll('[data-convid], .rps_c2d1');
    }
    return [];
  }

  getEmailId(element) {
    return element.getAttribute('data-message-id') ||
           element.getAttribute('data-convid') ||
           element.id ||
           element.innerHTML.substring(0, 50);
  }

  async analyzeEmail(emailElement) {
    try {
      const emailData = this.extractEmailData(emailElement);
      if (!emailData.subject && !emailData.body) return;

      const analysis = await this.nlpModel.analyzeEmail(emailData);
      this.displayResult(emailElement, analysis);
    } catch (error) {
      console.error('PhishGuard: Error analyzing email:', error);
    }
  }

  extractEmailData(element) {
    const subject = this.extractSubject(element);
    const body = this.extractBody(element);
    const sender = this.extractSender(element);
    const links = this.extractLinks(element);
    return { subject, body, sender, links };
  }

  extractSubject(element) {
    const selector = this.isGmail ? '.hP' : '.subject';
    const el = element.querySelector(selector) || document.querySelector(selector);
    return el ? el.textContent.trim() : '';
  }

  extractBody(element) {
    const selector = this.isGmail ? '.ii.gt div' : '.rps_c2d1';
    const el = element.querySelector(selector) || element;
    return el ? el.textContent.trim() : '';
  }

  extractSender(element) {
    const selector = this.isGmail ? '.gD' : '.sender';
    const el = element.querySelector(selector) || document.querySelector(selector);
    return el ? el.textContent.trim() : '';
  }

  extractLinks(element) {
    const links = [];
    element.querySelectorAll('a[href]').forEach(link => {
      const href = link.getAttribute('href');
      const text = link.textContent.trim();
      if (href && href.startsWith('http')) links.push({ url: href, text });
    });
    return links;
  }

  displayResult(emailElement, analysis) {
    const existing = emailElement.querySelector('.phishguard-indicator');
    if (existing) existing.remove();

    const indicator = document.createElement('div');
    indicator.className = `phishguard-indicator ${analysis.classification}`;
    const icon = analysis.classification === 'phishing' ? '⚠️' : '✅';
    const message = `${icon} ${analysis.classification.toUpperCase()} (${Math.round(analysis.confidence * 100)}%)`;
    indicator.innerHTML = `<div>${message}</div>`;

    emailElement.style.position = 'relative';
    emailElement.insertBefore(indicator, emailElement.firstChild);
  }
}

// -------------------------
// EmailNLPAnalyzer class
// -------------------------

class EmailNLPAnalyzer {
  constructor() {
    this.patterns = [/urgent/i, /verify/i, /account/i, /click here/i];
  }

  async analyzeEmail(emailData) {
    const text = `${emailData.subject} ${emailData.body}`.toLowerCase();
    const threatScore = this.patterns.reduce((score, pattern) => 
      pattern.test(text) ? score + 0.25 : score, 0);
    const classification = threatScore > 0.5 ? 'phishing' : 'safe';
    const confidence = Math.min(threatScore, 1);
    return { classification, confidence, threatScore };
  }
}

// ✅ Initialize PhishingDetector on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new PhishingDetector());
} else {
  new PhishingDetector();
}
