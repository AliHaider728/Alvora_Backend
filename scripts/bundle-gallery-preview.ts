import { createGalleryFixture } from './bundle-gallery-fixture';
const { app, token } = createGalleryFixture();
// This token is generated only with the isolated test secret, never production credentials.
app.get('/fixture-token', (_req, res) => res.json({ token }));
app.listen(5108, '127.0.0.1', () => console.log('Isolated gallery API ready on 127.0.0.1:5108'));
