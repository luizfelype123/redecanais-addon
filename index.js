const express = require('express');
const axios   = require('axios');
const cheerio = require('cheerio');

const app  = express();
const PORT = process.env.PORT || 3000;

const BASE = 'https://redecanais.fm';   // se mudar, troque aqui

app.get('/manifest.json', (req, res) => {
  res.json({
    id: 'redecanais.addon',
    version: '1.0.0',
    name: 'RedeCanais',
    description: 'Filmes e séries do RedeCanais',
    resources: ['stream'],
    types: ['movie', 'series'],
    idPrefixes: ['tt'],
    catalogs: []
  });
});

app.get('/stream/:type/:id.json', async (req, res) => {
  const imdbId = req.params.id.replace('.json', '');
  try {
    const searchHtml = await axios.get(`${BASE}/?s=${imdbId}`, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    const $ = cheerio.load(searchHtml.data);
    const link = $('article a').first().attr('href');
    if (!link) return res.json({ streams: [] });

    const pageHtml = await axios.get(link, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    const $$ = cheerio.load(pageHtml.data);
    const streams = [];
    $$('iframe[src*="embed"]').each((i, el) => {
      const url = $$(el).attr('src');
      if (url) streams.push({
        title: `Player ${i + 1}`,
        url: url.startsWith('http') ? url : `https:${url}`
      });
    });
    res.json({ streams });
  } catch (e) {
    res.json({ streams: [] });
  }
});

app.listen(PORT, () => console.log(`ON ${PORT}`));