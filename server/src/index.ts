import express from 'express';
import { listings } from './listings';

const app = express();
const port = 9000;

app.use(express.json());

// /listings
app.get('/listings', (_req, res) => res.send(listings));

// /delete-listing
app.post('/delete-listing', (req, res) => {
  const id: string = req.body.id;

  for (let i = 0; i < listings.length; i++) {
    if (listings[i].id === id) {
      return res.send(listings.splice(i, 1));
    }
  }

  return res.send('failed to delete listing');
});

app.listen(port);

console.log(`[app]: http://localhost:${port}`);
