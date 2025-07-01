console.log("Hallo wereld")
 
// Info van .env file toevoegen om .env te processen.
require("dotenv").config()
 
// Express webserver initialiseren
const express = require("express")
const app = express()
const helmet = require("helmet")
const port = 4000
 
const xss = require('xss')
 
var sessions = require('express-session')
 
const bcrypt = require ("bcryptjs")
 
const multer = require("multer")
//Hier gaan de ingevoerde foto's naartoe
const upload = multer({dest: 'static/upload/'})
 
//static data access mogelijk maken
app.use("/static", express.static("static"))
 
// header script
app.use(express.static('public'))

//cors gebruiken om frontend requests naar de backend mogelijk te maken
const cors = require("cors")
app.use(cors())

// request require om de volgende code van spotify werkend te maken
const request = require("request")
 
//APi token krijgen in de backenc
async function getAccessToken(){
  try{
      const response = await fetch('http://localhost:4000/token')
      const data = await response.json()
      return data.access_token
  } catch(error){
      console.error("Token not fetched", error)
  }
}
 
//ApI aanspreken in de backend
async function getArtist(artistId) {
  try {
    // Access token opvragen voordat de data opgevraagd wordt
    const accessToken = await getAccessToken()
 
    //krijg een random array aan artiesten met een random begin letter
    const response = await fetch(`https://api.spotify.com/v1/artists/${artistId}`, {
      headers: {
        Authorization: 'Bearer ' + accessToken
      }})
 
      console.log("Spotify API response status:", response.status)// Debugging
      //alle artiesten data loggen
      const data = await response.json()
      // console.log("Artist data:", data.artistsId.items)
      console.log(data.name)
      return data
 
  } catch (error) {
      console.error('Error fetching data:', error)
  }
  
}

// Inline validatie functie
function validateRegistrationForm(body, file) {
  const errors = []
  
  if (!body.name || body.name.trim().length < 2) {
    errors.push({ field: 'name', message: 'Naam moet minimaal 2 karakters zijn' })
  }
  
  if (!body.email || !body.email.includes('@')) {
    errors.push({ field: 'email', message: 'Geldig emailadres is vereist' })
  }
  
  if (!body.password || body.password.length < 6) {
    errors.push({ field: 'password', message: 'Wachtwoord moet minimaal 6 karakters zijn' })
  }
  
  return {
    valid: errors.length === 0,
    errors: errors
  }
}
 
//Activeren van de helmet module EN alle bronnen van ander websites worden toegestaan
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.js", "https://cdnjs.cloudflare.com/ajax/libs/list.js/2.3.1/list.min.js"],// Voeg Swiper CDN toe aan scriptSrc
        connectSrc: ["'self'", "https://api.spotify.com", "http://localhost:4000"], // API calls naar Spotify en backend toestaan
        frameSrc: ["'self'", "https://open.spotify.com"], // Spotify playlist embeds toestaan
        imgSrc: ["'self'", "data:", "https://i.scdn.co"], // Foto's toestaan van de door Spotify gegeven bron
        styleSrc: ["'self'", 'https://fonts.googleapis.com', "https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.css"], // Voeg Swiper CDN toe aan styleSrc
      },
    },
  })
)
 
//Middleware Sessions bij het inloggen
app.use(
  sessions({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
  }),
)
 
//ejs templates opstarten
app.set("view engine", "ejs")
 
// maakt het mogelijk om informatie op te halen die in formulieren wordt opgegeven
app.use(express.urlencoded({ extended: true }))

//******* DATABASE **********
const { MongoClient, ServerApiVersion } = require("mongodb")
// URL aanmaken om met de database te connecten met info uit de .env file //process klopt wel alleen komt het uit de extensie wat Eslint niet kan lezen
const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}/?retryWrites=true&w=majority&appName=${process.env.DB_NAME}`
//MongoClient met een MongoClientOptions object aanmaken om de Stable API versie vast te leggen
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
})
 
async function run() {
  try {
    // client met server connecten (optional starting in v4.7)
    await client.connect()
    // ping sturen om een succesvol connectie te bevestigen
    await client.db("admin").command({ ping: 1 })
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!",
    )
  } finally {
    // client closes bij finish/error
    // await client.close()
  }
}
run().catch(console.dir)

// inloggegevens voor de Spotify API App vanuit de .env laden
const client_id = process.env.CLIENT_ID
const client_secret = process.env.CLIENT_SECRET

//console log op welke poort je bent
app.listen(port, () => {
  console.log(`Listening on port ${port}`)
})
 
// ******* ROUTES **********
app.get("/", function (req, res) {
  res.render("pages/index")
})
 
app.get("/inlog", function (req, res) {
  //Route van de Inlogpagina
  res.render("pages/inlog")
})
 
app.get("/about", (req, res) => {
  res.render("pages/about") // Zorg ervoor dat je een about.ejs bestand hebt in de 'views/pages' map
})
 
app.get('/tuneder', (req, res) => {
    res.render('pages/tuneder') // Zorg ervoor dat "tuneder.ejs" bestaat in de map views/pages/
  })
 
app.get("/contact", (req, res) => {
  res.render("pages/contact") // Zorg ervoor dat je een contact.ejs bestand hebt
})
 
app.get("/filter-populariteit", function (req, res) {
  res.render("pages/filter-populariteit")
})
 
app.get("/filter-genre", function (req, res) {
  res.render("pages/filter-genre")
})
 
app.get("/fout-inlog", function (req, res) {
  res.render("pages/fout-inlog")
})
 
//Route voor de form van het acount aanmaken
app.get("/aanmelden", (req, res) => {
  res.render("pages/aanmelden", { errors: [], formData: {} })
})
 
//**********Account aanmaken plus toevoegen in mongo**********
app.post('/add-account', upload.single('profielFoto'), async (req, res) => {
  try {
    // Valideer de formuliergegevens
    const validation = validateRegistrationForm(req.body, req.file)
    
    if (!validation.valid) {
      // Als validatie faalt, stuur errors terug naar de aanmeldpagina
      return res.render("pages/aanmelden", {
        errors: validation.errors,
        formData: req.body // Behoud ingevulde gegevens
      })
    }
    
    const database = client.db("klanten")
    const gebruiker = database.collection("user")
    
    // Controleer of email al bestaat
    const existingUser = await gebruiker.findOne({ emailadress: req.body.email.trim() })
    if (existingUser) {
      return res.render("pages/aanmelden", {
        errors: [{ field: 'email', message: 'Dit emailadres is al in gebruik' }],
        formData: req.body
      })
    }
    
    // Hash het wachtwoord
    const hashedPassword = await bcrypt.hash(req.body.password, 12) // Verhoogd naar 12 rounds voor betere beveiliging
    
    // Bepaal bestandsnaam
    let filename
    if (req.file && req.file.filename) {
      filename = req.file.filename
    } else {
      filename = "profiel-placeholder.png"
    }
    
    // Maak het document aan met gezuiverde data
    const doc = {
      name: xss(req.body.name.trim()),            
      emailadress: xss(req.body.email.trim().toLowerCase()), // Zet email naar lowercase
      password: hashedPassword,
      profielFoto: filename,
      favorieten: [],
      createdAt: new Date() // Voeg timestamp toe
    }
    
    // Voeg gebruiker toe aan database
    const toevoegen = await gebruiker.insertOne(doc)
    console.log(`A document was inserted with the _id: ${toevoegen.insertedId}`)
    
    if (toevoegen.insertedId) {
      // Zoek de nieuwe gebruiker
      const newUser = await gebruiker.findOne({ emailadress: doc.emailadress })
      
      if (newUser) {
        console.log("Gebruiker is gevonden na het toevoegen")
        // Zet gebruiker in sessie
        req.session.user = newUser
        // Redirect naar profiel
        res.redirect("/profiel")
      } else {
        throw new Error("Gebruiker kon niet worden gevonden na aanmaken")
      }
    } else {
      throw new Error("Gebruiker kon niet worden aangemaakt")
    }
    
  } catch (error) {
    console.error("Fout bij aanmaken account:", error)
    res.render("pages/aanmelden", {
      errors: [{ field: 'general', message: 'Er ging iets mis bij het aanmaken van je account. Probeer het opnieuw.' }],
      formData: req.body
    })
  }
})
 
//**********inloggen en check via mongo**********
app.post("/inlog-account", async (req, res) => {
  let artiesten = []
  //Eerst de consts weer definieren vanuit welke database de gegevens gehaald moeten worden
  const database = client.db("klanten")
  const gebruiker = database.collection("user")
 
  //Een query aanmaken met daarin de email om zo op te kunnen zoeken of die gebruiker bestaan op basis wat de gebruiker heeft ingevuld bij de form
  const query = { emailadress: xss(req.body.email) }
 
  //Code om de user daadwerkelijk te vinden, met daarbij de overeenkomst van de query
  const user = await gebruiker.findOne(query)
 
  //if else state met daarin dat de gebruiker overeen moet komen met het opgegeven wachtwoord + een respons terug geven aan de gebruiker
  if (user) {
    // Vergelijk het ingevoerde wachtwoord met het gehashte wachtwoord in de database
    const isMatch = await bcrypt.compare(req.body.password, user.password)
 
    if (isMatch) {
      // Als het wachtwoord overeenkomt, start de sessie en daarin slaat hij user op
   // fetch data van api
      for (const favoriet of user.favorieten) {
        const artiest = await getArtist(favoriet)
        artiesten.push(artiest)
      }
      req.session.user = user
      res.render("pages/profiel", { user: req.session.user, artiesten })
    } else {
      // Als het wachtwoord niet overeenkomt
      res.send("Wachtwoord komt niet overeen")
    }
  } else {
    // Als de gebruiker niet wordt gevonden
 
    res.render("pages/fout-inlog")
  }
})
 
//Functie van het account scherm, als de account al bestaat dan naar profiel en anders naar het inlogscherm leiden.
app.get("/profiel", async(req, res) => {
  //Om het opnieuw op te halen van de artiesten als je de pagina opnieuw opvraagd
  let artiesten = []
  
  if (req.session.user) {
    const database = client.db("klanten")
    const gebruiker = database.collection("user")
    const query = { emailadress: xss(req.session.user.emailadress) }
    const user = await gebruiker.findOne(query)
    console.log(req.session.user.emailadress)
 
    for (const favoriet of user.favorieten) {
      const artiest = await getArtist(favoriet)
      artiesten.push(artiest)
    }
    res.render("pages/profiel", { user: req.session.user, artiesten})
  } else {
    res.render("pages/inlog")
  }
})
 
//**********artiesten opslaan in mongodb**********
//ophalen pagina + het connecten van de pagina aan de database, zodat deze ook de gegevens kan zien
app.get("/opgeslagen-artiesten", async (req, res) => {
 
  let artiesten = []
 
  if (!req.session.user) {
    return res.redirect("/inlog")
  }
 
  const database = client.db("klanten")
  const gebruiker = database.collection("user")
 
  // Haal de gebruiker op basis van de sessiegegevens
  const query = { emailadress: req.session.user.emailadress }
  const user = await gebruiker.findOne(query)
 
  if (user) {
    console.log("gebruiker gevonden")
 
    // fetch data van api
    for (const favoriet of user.favorieten) {
      const artiest = await getArtist(favoriet)
      artiesten.push(artiest)
    }
 
    // return res.status(404).send("Gebruiker gevonden")
    res.render("pages/opgeslagen-artiesten", { user, artiesten}) // Zorg ervoor dat je een about.ejs bestand hebt in de 'views/pages' map
  } else {
    // res.send("Gebruiker is niet gevonden")
    res.render("pages/inlog")
  }
 
})
 
//Als het goed is moet :artiest dan vervangen worden door iets van de api
//Het klopt nog niet helemaal 100% en ik weet niet of dat aan de code ligt voor de session
app.post("/opgeslagen-artiesten",async (req, res) => {
console.log("Ontvangen artiest ID:", req.body.artistId)
 
  if (!req.session.user) {
    return res.redirect("/inlog") // Voorkomt fout als er geen sessie is
  }
 
  const database = client.db("klanten")
  const gebruiker = database.collection("user")
 
  const query = { emailadress: req.session.user.emailadress }
  const user = await gebruiker.findOne(query)
 
//Een object met daarin alle info wat naar de mongodb gestuurd moet worden, dit komt overeen met de api
  const artiestData = req.body.artistId
  const index = user.favorieten.indexOf(artiestData)
 
  console.log (index)
  
  if (user) {
    console.log("Gebruiker gevonden:", user)
    //Als de gebruiker bestaat en de index is afwezig, dan moet hij die eruit halen.
    if  (artiestData == ""){
      console.log("Dit is de milo laat het lukken placholder")
      return
    } else {
        if (index >= 0){
          user.favorieten.splice(index, 1)
          await gebruiker.updateOne(
            { emailadress: req.session.user.emailadress},
            //Uiteindelijk alle artiestendata doorsturen naar database
            { $set: { favorieten: user.favorieten}})
          console.log("Artiest is verwijdert uit favorieten")
        } else {
              //Als de gebruiker bestaat en de index is aanwezig, dan moet hij die toevoegen
          await gebruiker.updateOne(
            { emailadress: req.session.user.emailadress},
            //Uiteindelijk alle artiestendata doorsturen naar database
            { $push: { favorieten:  artiestData } },
            console.log("Artiest is toegevoegd")
          )
        }}}
  else {
    // console.log('of niet')
    // return res.status(404).send("Gebruiker niet gevonden")
    res.render("pages/inlog")
  }
  res.redirect("/opgeslagen-artiesten")
})
 
// ******** uitloggen **********
 
app.get("/uitloggen", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Fout bij uitloggen:", err)
      return res.send("Er ging iets mis bij het uitloggen.")
    }
    res.redirect("/inlog")
  })
})
 
//*******  VRAGEN EN KEUZE OPSLAAN ********
//populariteitswaarde opslaan
// populariteit opslaan
app.post("/populariteit-kiezen", async (req, res) => {
  let populariteit = req.body.populariteit // slider value ophalen
  
  // data mergen
  req.session.user = req.session.user || {}
  req.session.user.valuePopulariteit = populariteit
 
  const database = client.db("klanten")
  const gebruiker = database.collection("user")
 
  const query = { emailadress: req.session.user.emailadress }
  const user = await gebruiker.findOne(query)
 
  console.log("Saved popularity value:", populariteit)
 
  res.render("pages/tuneder", {user}) // render tuneder pagina
})
 
app.get("/api/populariteit", (req, res) => {
  res.json({ valuePopulariteit: req.session.user})
})
 
//gekozen genres opslaan
 
app.post("/genre-kiezen", (req, res) => {
  // alle genres ophalen en lege array als geen genres geselecteerd zijn
  let selectedGenres = req.body.genre || []
 
  // nieuwe data mergen aan session die al bestaat
  req.session.user = req.session.user || {}  //checken of een req.session.user bestaat
  req.session.user.selectedGenres = selectedGenres
 
  console.log("Saved genres:", selectedGenres)
 
  // Render the next page
  res.render("pages/filter-populariteit")
})
 
app.get("/api/genres", (req, res) => {
  console.log("Session data:", req.session)
  if (req.session.user && req.session.user.selectedGenres) {
 
    console.log("Genres uit session:", req.session.user.selectedGenres)
    res.json({ selectedGenres: req.session.user.selectedGenres })
  } else {
    //geen genres selected, dan return lege array
    console.log("Geen genres gevonden in session")
    res.json({ selectedGenres: [] })
  }
})
 
// ******** SPOTIFY API **********

// access token aanvragen, die later van de frontend voor de API call kan worden gebruikt
app.get("/token", (req, res) => {
  const authOptions = {
    url: "https://accounts.spotify.com/api/token",
    headers: {
      Authorization:
        "Basic " +
        Buffer.from(client_id + ":" + client_secret).toString("base64"),
    },
    form: { grant_type: "client_credentials" },
    json: true,
  }
 
  request.post(authOptions, (error, response, body) => {
    if (error) {
      return res.status(500).json({ error: "Failed to get token" })
    }
    if (response.statusCode !== 200) {
      return res.status(response.statusCode).json({ error: body })
    }
    
    // Send the token to the frontend
    res.json({ access_token: body.access_token })
  })
})
 
// ******* ERROR HANDLING ********
//moet onder routes staan dus niet verschuiven!
//Error 404
app.use((req, res) => {
  // log error to console
  console.error('404 error at URL: ' + req.url)
  // send back a HTTP response with status code 404
  // res.status(404).send('404 error at URL: ' + req.url)
  res.status(404).render("pages/404")
})
 
// error 500 handling
app.use((err, req, res, next) => {
  // console log voor error 500
  console.error(err.stack)
  // 500 status code als HTTP response sturen
  res.status(500).send("500: server error")
})