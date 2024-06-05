const axios = require('axios');
const nlp = require('compromise');

// const openaiApiKey = 'apiKey';
// const openaiApiUrl = 'url';

let detectedMovies = [];
let detectedPeople = [];

async function getChatResponse(userInput) {
  try {
    const response = await axios.post(openaiApiUrl, {
      prompt: userInput,
      max_tokens: 150,
      n: 1,
      stop: null,
      temperature: 0.9,
    }, {
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json'
      }
    });

    return response.data.choices[0].text.trim();
  } catch (error) {
    console.error('Error:', error);
    return 'Sorry, I couldn\'t process your request.';
  }
}

function extractEntities(text) {
  const doc = nlp(text);
  const movies = doc.match('#Movie').out('array');
  const people = doc.match('#Person').out('array');
  
  return {
    movies,
    people
  };
}

function saveEntities(entities) {
  detectedMovies.push(...entities.movies);
  detectedPeople.push(...entities.people);
}

// Example usage:
const userInput = 'Tell me about the movie Inception starring Leonardo DiCaprio.';
getChatResponse(userInput).then(chatResponse => {
  console.log('Chat Response:', chatResponse);

  const entities = extractEntities(userInput);
  saveEntities(entities);

  console.log('Detected Movies:', detectedMovies);
  console.log('Detected People:', detectedPeople);
});
