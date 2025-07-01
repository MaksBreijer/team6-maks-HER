
// Validator functies voor het aanmeldformulier
const validator = {
  // Email validatie
  validateEmail(email) {
    if (!email || typeof email !== 'string') {
      return { valid: false, message: 'Email is verplicht' }
    }
    
    // Basis email regex patroon.   n
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    
    if (!emailRegex.test(email.trim())) {
      return { valid: false, message: 'Ongeldig email formaat' }
    }
    
    if (email.trim().length > 254) {
      return { valid: false, message: 'Email is te lang (max 254 karakters)' }
    }
    
    return { valid: true }
  },

  // Naam validatie
  validateName(name) {
    if (!name || typeof name !== 'string') {
      return { valid: false, message: 'Naam is verplicht' }
    }
    
    const trimmedName = name.trim()
    
    if (trimmedName.length < 2) {
      return { valid: false, message: 'Naam moet minimaal 2 karakters bevatten' }
    }
    
    if (trimmedName.length > 50) {
      return { valid: false, message: 'Naam is te lang (max 50 karakters)' }
    }
    
    // Alleen letters, spaties en koppeltekens toestaan
    const nameRegex = /^[a-zA-ZàáâäãåąčćęèéêëėįìíîïłńòóôöõøùúûüųūÿýżźñçčšžÀÁÂÄÃÅĄĆČĖĘÈÉÊËÌÍÎÏĮŁŃÒÓÔÖÕØÙÚÛÜŲŪŸÝŻŹÑßÇŒÆČŠŽ\s\-']+$/
    
    if (!nameRegex.test(trimmedName)) {
      return { valid: false, message: 'Naam mag alleen letters, spaties en koppeltekens bevatten' }
    }
    
    return { valid: true }
  },

  // Wachtwoord validatie
  validatePassword(password) {
    if (!password || typeof password !== 'string') {
      return { valid: false, message: 'Wachtwoord is verplicht' }
    }
    
    if (password.length < 8) {
      return { valid: false, message: 'Wachtwoord moet minimaal 8 karakters bevatten' }
    }
    
    if (password.length > 128) {
      return { valid: false, message: 'Wachtwoord is te lang (max 128 karakters)' }
    }
    
    // Controleer op minimaal één hoofdletter
    if (!/[A-Z]/.test(password)) {
      return { valid: false, message: 'Wachtwoord moet minimaal één hoofdletter bevatten' }
    }
    
    // Controleer op minimaal één kleine letter
    if (!/[a-z]/.test(password)) {
      return { valid: false, message: 'Wachtwoord moet minimaal één kleine letter bevatten' }
    }
    
    // Controleer op minimaal één cijfer
    if (!/\d/.test(password)) {
      return { valid: false, message: 'Wachtwoord moet minimaal één cijfer bevatten' }
    }
    
    // Controleer op minimaal één speciaal karakter
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      return { valid: false, message: 'Wachtwoord moet minimaal één speciaal karakter bevatten (!@#$%^&*(),.?":{}|<>)' }
    }
    
    return { valid: true }
  },

  // Bestand validatie (optioneel voor profielfoto)
  validateFile(file) {
    if (!file) {
      return { valid: true } // Bestand is optioneel
    }
    
    // Toegestane bestandstypen
    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png']
    
    if (!allowedMimeTypes.includes(file.mimetype)) {
      return { valid: false, message: 'Alleen JPG, JPEG en PNG bestanden zijn toegestaan' }
    }
    
    // Maximale bestandsgrootte (5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB in bytes
    if (file.size > maxSize) {
      return { valid: false, message: 'Bestand is te groot (max 5MB)' }
    }
    
    return { valid: true }
  },

  // Hoofdvalidatie functie die alle velden controleert
  validateRegistrationForm(formData, file = null) {
    const errors = []
    
    // Valideer naam
    const nameValidation = this.validateName(formData.name)
    if (!nameValidation.valid) {
      errors.push({ field: 'name', message: nameValidation.message })
    }
    
    // Valideer email
    const emailValidation = this.validateEmail(formData.email)
    if (!emailValidation.valid) {
      errors.push({ field: 'email', message: emailValidation.message })
    }
    
    // Valideer wachtwoord
    const passwordValidation = this.validatePassword(formData.password)
    if (!passwordValidation.valid) {
      errors.push({ field: 'password', message: passwordValidation.message })
    }
    
    // Valideer bestand (indien aanwezig)
    const fileValidation = this.validateFile(file)
    if (!fileValidation.valid) {
      errors.push({ field: 'profielFoto', message: fileValidation.message })
    }
    
    return {
      valid: errors.length === 0,
      errors: errors
    }
  }
}
