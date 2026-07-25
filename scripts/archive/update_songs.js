require('dotenv').config({path: '.env.local'});
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL
});

const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;

const rawData = `Agarthi - Burning Core - Play With Fire (The Rolling Stones)
Agarthi - Floating Lands - Walking On A Dream (Empire of the Sun)
Akro - Rise - Here Comes The Sun (The Beatles)
Amouage - Overture Woman - Sinnerman (Nina Simone)
Arabian Oud - Aseel Special Edition - Desert Rose (Sting)
Arabian Oud - Madawi - Habibi (Tamino)
Arabian Oud - Royal Oud - Royals (Lorde)
Areej Le Doré - Gul Hina - Kashmir (Led Zeppelin)
Aroma Di Lamore - Abu Dhabi - Prince Ali (Robin Williams)
Aroma Di Lamore - Las Vegas - Viva Las Vegas (Elvis Presley)
Aroma Di Lamore - Milano - Fashion (David Bowie)
Aroma Di Lamore - Munich - Rock Me Amadeus (Falco)
Aroma Di Lamore - Ryiadh - Oud (Arabesque)
ASMR Fragrances - Chocolate Crush - Sweet Dreams (Eurythmics)
ASMR Fragrances - Ocean Relaxation - Orinoco Flow (Enya)
ASMR Fragrances - Yummy Tingles - Yummy (Justin Bieber)
Atelier Materi - Iris Ebène - Nocturne op. 9 No. 2 (Chopin)
Bergamoss - Let's make love on Christmas - Santa Baby (Eartha Kitt)
Bergamoss - Nettarina Frizzante - Peaches (The Presidents of the United States of America)
Bergamoss - Pivoine de Malène - La Vie en Rose (Édith Piaf)
Birkholz - Aura of Amalfi - Mambo Italiano (Rosemary Clooney)
Birkholz - Mornings In Milano - Buonasera Signorina (Louis Prima)
Birkholz - Sol e Samba - Samba de Janeiro (Bellini)
Birkholz - Vivid in Verona - Love Story (Taylor Swift)
Boadicea the Victorious - Blue Sapphire Supercharged - Titanium (David Guetta)
Boadicea the Victorious - Dasman - Paint It, Black (The Rolling Stones)
Boadicea the Victorious - Energizer - Don't Stop Me Now (Queen)
Boadicea the Victorious - Glorious - Glorious (Macklemore)
Bohoboco - Red Wine Brown Sugar - Red Red Wine (UB40)
Bohoboco - Sea Salt Caramel - Sugar (Maroon 5)
Bortnikoff - Cologne de Feu - Light My Fire (The Doors)
Bortnikoff - Dubai - Gold Digger (Kanye West)
Bortnikoff - Sayat Nova - Apricot Stone (Eva Rivas)
Byredo - Oud Immortel - Forever Young (Alphaville)
Christian Provenzano Parfums - Ophelie - Ophelia (The Lumineers)
Clive Christian - 1872 For Men - Symphony No. 5 (Beethoven)
Clive Christian - Blonde Amber - Blonde (Frank Ocean)
Clive Christian - Crab Apple Blossom - Apple (Charli XCX)
Clive Christian - Jump Up And Kiss Me Hedonistic - Kiss (Prince)
Clive Christian - L Floral Chypre With Rich Patchouli - Smooth Operator (Sade)
Comporta - Femme Fougere - Surfin' U.S.A (The Beach Boys)
Comporta - Vivi - Watermelon Sugar (Harry Styles)
Comporta - Will - Island In The Sun (Weezer)
Creed - Aventus 15X01 - The Man (The Killers)
De Gabor - Darling - Oh, Pretty Woman (Roy Orbison)
Dior - Homme Parfum - Careless Whisper (George Michael)
Dior - Tobacolor - Smoke Gets In Your Eyes (The Platters)
Dolce&Gabbana - Light Blue Forever pour Homme - Walking On Sunshine (Katrina & The Waves)
Dolce&Gabbana - Royal Night The One - One More Night (Phil Collins)
Duduar Milano - Tabaco - Tom's Diner (Suzanne Vega)
Elisire - Desired - I Want You (Savage Garden)
Elixir Privé - Mango White - Senorita (Shawn Mendes)
Ermenegildo Zegna - Italian Bergamot Eau de Parfum - Volare (Gipsy Kings)
Escentric Molecules - Molecule 01 - Invisible Touch (Genesis)
Farmacia SS. Annunziata - Citrus Paradisi - Lemon Tree (Fool's Garden)
Farmacia SS. Annunziata - Sparkling Notturno - City of Stars (Ryan Gosling)
Farmacia SS. Annunziata - Whisky Nobile - Whiskey Lullaby (Brad Paisley)
Fascent - Milky No Way - Milkshake (Kelis)
Fragrance Du Bois - Oud Jaune Intense - Yellow (Coldplay)
Fragrance Du Bois - Oud Orange Intense - Orange Crush (R.E.M.)
Frederic Malle - Acne Studios - Vogue (Madonna)
Gamalion Paris - Sublime Saison - Spring (Vivaldi)
Gio L’Arome - Emeraude - Emerald Eyes (Fleetwood Mac)
Gio L’Arome - Ruby - Ruby (Kaiser Chiefs)
Gio L’Arome - Topazio - Shine On You Crazy Diamond (Pink Floyd)
Gio L’Arome - Zafiro - Blue Velvet (Bobby Vinton)
Giorgio Armani - Acqua di Gio Essenza - Ocean Eyes (Billie Eilish)
Goti - Alchemico Visione 2 Acqua - Waterfalls (TLC)
Goti - Alchemico Visione 2 Aria - Air (Bach)
Goti - Alchemico Visione 2 Fuoco - Fire (Jimi Hendrix)
Goti - Alchemico Visione 2 Terra - Mother Earth (Within Temptation)
Goti - Black - Back To Black (Amy Winehouse)
Goti - Earth - Down To Earth (Peter Gabriel)
Goti - Gray - A Whiter Shade of Pale (Procol Harum)
Goti - Smoke - Smoke On The Water (Deep Purple)
Goti - White - White Flag (Dido)
Guerlain - Cherry Oud - Cherry Bomb (The Runaways)
Guerlain - L'Instant de Guerlain pour Homme - A Moment Like This (Kelly Clarkson)
Guerlain - Musc Noble - Queen (Perfume Genius)
Henry Jacques - Merveilleuse - What A Wonderful World (Louis Armstrong)
Hermès - Terre d'Hermes - Earth Song (Michael Jackson)
Iggywoo - Love Extreme - Crazy In Love (Beyoncé)
Imaginary Authors - Decisions, Decisions - Should I Stay Or Should I Go (The Clash)
Imaginary Authors - Falling Into The Sea - Under The Sea (The Little Mermaid)
Imaginary Authors - In Love With Everything - Perfect Day (Lou Reed)
Initio - Blessed Baraka - Hallelujah (Leonard Cohen)
iPiccirilli - Cocobay - Coconut Woman (Harry Belafonte)
iPiccirilli - Dune - Dune (Hans Zimmer)
iPiccirilli - Shocking Bull - Toro (Y La Bamba)
Jean Paul Gaultier - Le Male Superman Eau Fraiche - Kryptonite (3 Doors Down)
Jijide - Impeto Blu - XAN HAI - Blue (Da Ba Dee) (Eiffel 65)
Jijide - Scrigno Celeste - ZE BAI - Celeste (Laura Pausini)
Jorum Studio - Trimerous - Scottish Winds (Frightened Rabbit)
Kilian - Flower of Immortality - Live Forever (Oasis)
Kilian - Fun Things Always Happen After Sunset - After Hours (The Weeknd)
Kilian - Killing Me Slowly - Killing Me Softly With His Song (Fugees)
KV - Chilli Candy Crush - Candy Shop (50 Cent)
KV - El Badia - Desert Caravan (Kitaro)
KV - She is Glowing - Girl On Fire (Alicia Keys)
Maie Piou - Banana Oud - Hollaback Girl (Gwen Stefani)
Maie Piou - Cherry Harley - Motorcycle Emptiness (Manic Street Preachers)
Maie Piou - Wood You - Into The Woods (Stephen Sondheim)
Maison Francis Kurkdjian - Baccarat Rouge 540 Extrait de Parfum - Diamonds (Rihanna)
Mayhap - Amant Numérique - Digital Love (Daft Punk)
Memoirs Of A Perfume Collector - Pacific Grapefruit - Pacific Coast Highway (Kavinsky)
Memoirs Of A Perfume Collector - Tales from Zanzibar - Africa (Toto)
Memoirs Of A Perfume Collector - Trouble In Paradise - Paradise City (Guns N' Roses)
Moresque - Sahara Blue - Sahara (DJ Snake)
Olfactive Studio - Chypre Shot - Shot In The Dark (Ozzy Osbourne)
Olfactive Studio - Woody Mood - In The Woods Somewhere (Hozier)
Optico Profumo - Brazil - Mas Que Nada (Sérgio Mendes)
Ormonde Jayne - Royal Elixir - Dancing Queen (ABBA)
OTO Parfum - Kalira - Jai Ho (A.R. Rahman)
Oud Elite - Masha'er - Feelings (Morris Albert)
Oud Elite - Quwafi Black - Black Betty (Ram Jam)
Parfums d'Elmar - Elixir d'Amour - The Power of Love (Celine Dion)
Parfums de Marly - Layton - Castle on the Hill (Ed Sheeran)
Parfums de Marly - Pegasus - Fly Me To The Moon (Frank Sinatra)
Pernoire - Mansa - Billionaire (Travie McCoy)
Philipp Plein Parfums - No Limit$ - Mo Money Mo Problems (The Notorious B.I.G.)
Ramon Monegal - Flamenco Extrait de Parfum - Malamente (Rosalía)
Regalien - Turkuaz - Turquoise (Donovan)
Renoir Parfums - Mojito Erotique - Havana (Camila Cabello)
Roads - I am Dance - I Wanna Dance With Somebody (Whitney Houston)
Roja - Amber Aoud Absolue Precieux - Sultans of Swing (Dire Straits)
Roja - Amber Aoud Crystal Parfum Oman Air Edition - Leaving On A Jet Plane (John Denver)
Roja - Aoud Absolue Precieux - Golden Touch (Razorlight)
Roja - Harrods Aoud - Waterloo Sunset (The Kinks)
Roja - Haute Parfumerie 15th Anniversary - Celebration (Kool & The Gang)
Roja - Haute Parfumerie 20th Anniversary - 24K Magic (Bruno Mars)
Roja - Kingdom of Saudi Arabia - Arabian Adventure (John Williams)
Roja - Kuwait - Sandstorm (Darude)
Roja - Musk Aoud Absolue Precieux - Muskrat Love (Captain & Tennille)
Roja - Pierre de Velay No. 1 - Feeling Good (Michael Bublé)
Roja - Pierre de Velay The Oud - Puttin' On The Ritz (Taco)
Roja - Qatar - Mirage (Armin van Buuren)
Rubeus Milano - Quercia - Oak Tree (Morris Day)
Simone Andreoli - Business Man - Takin' Care of Business (Bachman-Turner Overdrive)
Simone Andreoli - Malibu - Party in the Bay - California Gurls (Katy Perry)
Simone Andreoli - Zest di Sorrento - That's Amore (Dean Martin)
Soma Parfums - Halcyon - Halcyon On and On (Orbital)
Somens - Arena - Yellow Sand (YUI)
Somens - Aria - Nessun Dorma (Pavarotti)
Somens - Atlantis - Ocean Man (Ween)
Somens - Capriccio - Capriccio Espagnol (Rimsky-Korsakov)
Somens - Onice - Onyx (Ashanti)
Sora Dora - 7 - Seven Nation Army (The White Stripes)
Sora Dora - Jany - Janie's Got A Gun (Aerosmith)
Sospiro - Anniversary Edition - Happy Anniversary (Little River Band)
Sospiro - Contralto - Symphony (Clean Bandit)
Sospiro - Liberto - Freedom (Pharrell Williams)
SW19 - 6am - Morning Has Broken (Cat Stevens)
SW19 - 9pm - 9 PM (Till I Come) (ATB)
SW19 - Midnight - After Midnight (J.J. Cale)
SW19 - Noon - High Noon (Frankie Laine)
Tauer Perfumes - L'Air Des Alpes Suisses - The Sound of Music (Julie Andrews)
Teo Cabanel - Et Voilà - Voila (Barbara Pravi)
Thameen - Royal Sapphire - Diamonds Are A Girl's Best Friend (Marilyn Monroe)
The Harmonist - Hypnotizing Fire - Firestarter (The Prodigy)
The Lab - Amber Chocolate - Chocolate Rain (Tay Zonday)
The Lab - C'est La Vie - C'est La Vie (Khaled)
The Lab - Corinto Kush - Hits from the Bong (Cypress Hill)
The Lab - Fresh Vetiver - Green Onions (Booker T. & the M.G.'s)
The Lab - Karma - Karma Chameleon (Culture Club)
The Lab - Lotto Cocoon - Cocoon (Björk)
The Lab - Mang Oud - Mango Tree (Zac Brown Band)
The Lab - Neroli Negro - Black Magic (Little Mix)
The Lab - OMG - OMG (Usher)
The Lab - Tobacco Blanco - White Room (Cream)
The Spirit of Dubai - Ajyal - Generations (Journey)
The Spirit of Dubai - Bahar - Beyond the Sea (Bobby Darin)
The Spirit of Dubai - Majalis - Rich Girl (Hall & Oates)
Theodoros Kalotinis - Aegean Salt & Citrus - Cake By The Ocean (DNCE)
Theodoros Kalotinis - I Am Beautiful - Beautiful (Christina Aguilera)
Theodoros Kalotinis - Peach Macaron - Peaches (The Presidents of the United States of America)
Theodoros Kalotinis - Symposium - Zorba The Greek (Mikis Theodorakis)
Thomas de Monaco - Raw Gold - Heart of Gold (Neil Young)
Tom Ford - Black Orchid Parfum - Black Magic Woman (Santana)
Tom Ford - Ombre Leather - Born To Be Wild (Steppenwolf)
Tomorrowland - Elixir of Life - Wake Me Up (Avicii)
Ulrich Lang - Suncrest - Sun Is Shining (Bob Marley)
Vilhelm Parfumerie - Mango Skin - Mango (KAMAUU)
Villa Erbatium - Fig Whiskey - Tennessee Whiskey (Chris Stapleton)
Villa Erbatium - Mossy Glen - Green Grass of Tunnel (Múm)
Villa Erbatium - Scent of Seoul - Gangnam Style (PSY)
Villa Erbatium - Tabacco Lady - Lady (Modjo)
Widian - Al Wasl - Empire State of Mind (Jay-Z)
Widian - Limited 71 Extrait De Parfum - Midnight City (M83)
Widian - Limited 71 Extreme - Extreme Ways (Moby)
Widian - Limited 71 Intense - Strobe (deadmau5)
Xerjoff - Alexandria II - Purple Rain (Prince)
Xerjoff - Begum - Queen of Hearts (Juice Newton)
Xerjoff - Deified Tony Iommi Parfum - Paranoid (Black Sabbath)
Xerjoff - Erba Pura - Tutti Frutti (Little Richard)
Xerjoff - Jebel - Mountain Sound (Of Monsters and Men)
Xerjoff - Lira - Sugar, Sugar (The Archies)
Yves Saint Laurent - M7 - Devil Inside (INXS)
Yves Saint Laurent - Tuxedo - Sharp Dressed Man (ZZ Top)`;

let spotifyToken = '';

async function getSpotifyToken() {
    const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': 'Basic ' + Buffer.from(SPOTIFY_CLIENT_ID + ':' + SPOTIFY_CLIENT_SECRET).toString('base64')
        },
        body: 'grant_type=client_credentials'
    });
    const data = await response.json();
    spotifyToken = data.access_token;
}

async function searchSpotifyTrack(query) {
    if (!spotifyToken) await getSpotifyToken();
    const url = 'https://api.spotify.com/v1/search?type=track&limit=1&q=' + encodeURIComponent(query);
    const response = await fetch(url, {
        headers: {
            'Authorization': 'Bearer ' + spotifyToken
        }
    });
    if (response.status === 401) {
        await getSpotifyToken();
        return searchSpotifyTrack(query);
    }
    const data = await response.json();
    if (data.tracks && data.tracks.items && data.tracks.items.length > 0) {
        return data.tracks.items[0].external_urls.spotify;
    }
    return null;
}

async function main() {
    try {
        const lines = rawData.split('\n').filter(l => l.trim() !== '');
        
        // Fetch all active products to match precisely
        const res = await pool.query('SELECT id, brand, model FROM products WHERE active = true');
        const products = res.rows;
        
        let updatedCount = 0;
        let notFoundSongs = [];

        for (const line of lines) {
            // Find the longest product brand+model that matches the start of the line
            let matchedProduct = null;
            let songQuery = '';
            
            for (const p of products) {
                const prefix = `${p.brand} - ${p.model} - `;
                if (line.startsWith(prefix)) {
                    matchedProduct = p;
                    songQuery = line.substring(prefix.length).trim();
                    break;
                }
            }
            
            if (matchedProduct && songQuery) {
                console.log(`Searching for: "${songQuery}" (for ${matchedProduct.brand} - ${matchedProduct.model})`);
                const trackUrl = await searchSpotifyTrack(songQuery);
                
                if (trackUrl) {
                    await pool.query('UPDATE products SET spotify_track_url = $1 WHERE id = $2', [trackUrl, matchedProduct.id]);
                    console.log(`  -> Found: ${trackUrl}`);
                    updatedCount++;
                } else {
                    console.log(`  -> Song not found on Spotify`);
                    notFoundSongs.push(songQuery);
                }
                
                // Add a small delay to avoid rate limits
                await new Promise(r => setTimeout(r, 200));
            } else {
                console.log(`Could not match product for line: ${line}`);
            }
        }
        
        console.log(`\nFinished! Updated ${updatedCount} products.`);
        if (notFoundSongs.length > 0) {
            console.log("Songs not found:");
            console.log(notFoundSongs.join('\n'));
        }
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

main();
