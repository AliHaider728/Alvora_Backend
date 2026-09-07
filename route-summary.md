

### FILE: audioReviews.ts
- **Endpoint**: `router.get('/', async (req, res) => {`
- **Endpoint**: `router.get('/admin', authenticateToken, requireAdmin, async (req, res) => {`
- **Endpoint**: `router.post('/', authenticateToken, requireAdmin, upload.single('audio'), async (req, res) => {`
  - const { customerName, duration, displayOrder, isActive } = req.body;
- **Endpoint**: `router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {`
  - const { id } = req.params;
  - const { customerName, duration, displayOrder, isActive } = req.body;
- **Endpoint**: `router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {`
  - const { id } = req.params;


### FILE: auth.ts
- **Endpoint**: `router.post('/register', async (req: Request, res: Response) => {`
  - const { name, email, password } = req.body;
- **Endpoint**: `router.post('/login', async (req: Request, res: Response) => {`
  - const { email, password } = req.body;
- **Endpoint**: `router.post('/logout', (req: Request, res: Response) => {`
- **Endpoint**: `router.get('/me', authenticateToken, async (req: AuthRequest, res: Response) => {`
- **Endpoint**: `router.post('/wishlist', authenticateToken, async (req: AuthRequest, res: Response) => {`
  - const { wishlist } = req.body;
- **Endpoint**: `router.get('/users', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {`
- **Endpoint**: `router.post('/forgot-password', async (req: Request, res: Response) => {`
  - const { email } = req.body;
- **Endpoint**: `router.post('/reset-password', async (req: Request, res: Response) => {`
  - const { token, newPassword } = req.body;
- **Endpoint**: `router.post('/change-password', authenticateToken, async (req: AuthRequest, res: Response) => {`
  - const { newPassword } = req.body;


### FILE: bundles.ts
- **Endpoint**: `router.get('/', async (req, res) => {`
- **Endpoint**: `router.get('/:slug', async (req, res) => {`
  - const { slug } = req.params;
- **Endpoint**: `router.post('/', authenticateToken, requireAdmin, async (req, res) => {`
  - const { name, slug, description, image, discountPercent, isActive, displayOrder, products } = req.body;
- **Endpoint**: `router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {`
  - const { id } = req.params;
  - const { name, slug, description, image, discountPercent, isActive, displayOrder, products } = req.body;
- **Endpoint**: `router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {`
  - const { id } = req.params;


### FILE: categories.ts
- **Endpoint**: `router.get('/', async (_req: Request, res: Response) => {`
- **Endpoint**: `router.get('/admin/all', authenticateToken, requireSuperAdmin, async (_req: Request, res: Response) => {`
- **Endpoint**: `router.post('/', authenticateToken, requireSuperAdmin, async (req: Request, res: Response) => {`
  - const { name, slug, description, parentId, image, status, displayOrder, isFeatured } = req.body;
- **Endpoint**: `router.put('/:id', authenticateToken, requireSuperAdmin, async (req: Request, res: Response) => {`
  - const { name, slug, description, parentId, status, displayOrder, isFeatured } = req.body;
  - const [existing] = await pool.execute(`SELECT ${CATEGORY_COLS} FROM categories WHERE id = ?`, [req.params.id]);
  - const [dup] = await pool.execute('SELECT id FROM categories WHERE slug = ? AND id != ?', [slug.toLowerCase(), req.params.id]);
  - if (parentId === req.params.id) {
- **Endpoint**: `router.delete('/:id', authenticateToken, requireSuperAdmin, async (req: Request, res: Response) => {`
  - const { resolution, navigationResolution, targetCategoryId } = req.body;
  - const [catRows] = await conn.execute('SELECT id FROM categories WHERE id = ?', [req.params.id]);
  - if (!targetCategoryId || targetCategoryId === req.params.id) {


### FILE: contact.ts
- **Endpoint**: `router.post(`/`, async (req: Request, res: Response) => {`
  - const { name, email, subject, message } = req.body;
- **Endpoint**: `router.get(`/`, authenticateToken, requireAdmin, async (req: Request, res: Response) => {`
- **Endpoint**: `router.put(`/:id/status`, authenticateToken, requireAdmin, async (req: Request, res: Response) => {`
  - const { status } = req.body;
  - [status, now, req.params.id]
  - const [rows] = await pool.execute(`SELECT ${CONTACT_COLS} FROM contacts WHERE id = ?`, [req.params.id]);
- **Endpoint**: `router.delete(`/:id`, authenticateToken, requireAdmin, async (req: Request, res: Response) => {`
  - const [result] = await pool.execute(`DELETE FROM contacts WHERE id = ?`, [req.params.id]);


### FILE: coupons.ts
- **Endpoint**: `router.get(`/`, authenticateToken, requireAdmin, async (req: Request, res: Response) => {`
- **Endpoint**: `router.post(`/validate`, async (req: Request, res: Response) => {`
  - const { code, cartSubtotal } = req.body;
- **Endpoint**: `router.post(`/`, authenticateToken, requireAdmin, async (req: Request, res: Response) => {`
  - const data = normalizeCouponPayload(req.body);
- **Endpoint**: `router.put(`/:id`, authenticateToken, requireAdmin, async (req: Request, res: Response) => {`
  - const [existingRows] = await pool.execute(`SELECT ${COUPON_COLS} FROM coupons WHERE id = ?`, [req.params.id]);
  - const data = normalizeCouponPayload(req.body, currentCoupon);
- **Endpoint**: `router.delete(`/:id`, authenticateToken, requireAdmin, async (req: Request, res: Response) => {`
  - const [result] = await pool.execute(`DELETE FROM coupons WHERE id = ?`, [req.params.id]);


### FILE: globalAttributes.ts
- **Endpoint**: `router.get('/', async (req, res) => {`
- **Endpoint**: `router.get('/:id', async (req, res) => {`
  - const attr = await getAttributeWithTerms(req.params.id);
- **Endpoint**: `router.post('/', authenticateToken, requireSuperAdmin, async (req, res) => {`
  - const { name, slug, displayType } = req.body;
  - if (req.body.terms && Array.isArray(req.body.terms)) {
  - for (let i = 0; i < req.body.terms.length; i++) {
  - const t = req.body.terms[i];
- **Endpoint**: `router.put('/:id', authenticateToken, requireSuperAdmin, async (req, res) => {`
  - const { name, slug, displayType } = req.body;
  - const [existing] = await pool.execute(`SELECT ${GLOBAL_ATTR_COLS} FROM global_attributes WHERE id = ?`, [req.params.id]);
  - const [dup] = await pool.execute('SELECT id FROM global_attributes WHERE slug = ? AND id != ?', [slug.toLowerCase(), req.params.id]);
  - [name || null, slug ? slug.toLowerCase() : null, displayType || null, new Date(), req.params.id]
  - res.json(await getAttributeWithTerms(req.params.id));
- **Endpoint**: `router.delete('/:id', authenticateToken, requireSuperAdmin, async (req, res) => {`
  - const [existing] = await pool.execute('SELECT id FROM global_attributes WHERE id = ?', [req.params.id]);
  - await pool.execute('DELETE FROM global_attributes WHERE id = ?', [req.params.id]);
- **Endpoint**: `router.post('/:id/terms', authenticateToken, requireSuperAdmin, async (req, res) => {`
  - const attr = await getAttributeWithTerms(req.params.id);
  - const { label, slug, value, colorValue, imageUrl, imageAlt } = req.body;
  - [termId, req.params.id, label, slug, value, colorValue || null, imageUrl || null, imageAlt || null, attr.terms.length]
  - res.status(201).json(await getAttributeWithTerms(req.params.id));
- **Endpoint**: `router.put('/:id/terms/:termId', authenticateToken, requireSuperAdmin, async (req, res) => {`
  - const attr = await getAttributeWithTerms(req.params.id);
  - const term = attr.terms.find((t: any) => t.id === req.params.termId);
  - const { label, slug, value, colorValue, imageUrl, imageAlt } = req.body;
  - if (attr.terms.some((t: any) => t.slug === slug && t.id !== req.params.termId)) {
- **Endpoint**: `router.delete('/:id/terms/:termId', authenticateToken, requireSuperAdmin, async (req, res) => {`
  - const [result] = await pool.execute('DELETE FROM global_attribute_terms WHERE id = ? AND attribute_id = ?', [req.params.termId, req.params.id]);
  - res.json(await getAttributeWithTerms(req.params.id));


### FILE: orders.ts
- **Endpoint**: `router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {`
  - const { email, page, limit, search, status } = req.query;
- **Endpoint**: `router.get('/:orderId', authenticateToken, async (req: AuthRequest, res: Response) => {`
  - const order = await getFullOrder(pool, req.params.orderId);
- **Endpoint**: `router.post('/', async (req: Request, res: Response) => {`
  - const { customerName, email, phone, items, discountAmount = 0, shippingAddress, appliedCoupon, checkoutRequestId, shippingFee: clientShippingFee } = req.body;
- **Endpoint**: `router.put('/:orderId/status', authenticateToken, requireAdmin, async (req: Request, res: Response) => {`
  - const { status, note } = req.body;
  - const [orderRows] = await conn.execute('SELECT id, status, orderId FROM orders WHERE id = ? OR orderId = ? FOR UPDATE', [req.params.orderId, req.params.orderId]);
- **Endpoint**: `router.put('/:orderId/tracking', authenticateToken, requireAdmin, async (req: Request, res: Response) => {`
  - const { trackingNumber } = req.body;
  - [trackingNumber, new Date(), req.params.orderId]
  - const updated = await getFullOrder(pool, req.params.orderId);
- **Endpoint**: `router.delete('/:orderId', authenticateToken, requireAdmin, async (req: Request, res: Response) => {`
  - const [orderRows] = await pool.execute('SELECT id FROM orders WHERE id = ? OR orderId = ?', [req.params.orderId, req.params.orderId]);


### FILE: products.ts
- **Endpoint**: `router.get('/', authenticateIfPresent, async (req: AuthRequest, res: Response) => {`
  - const { category, search, isVisible, limit } = req.query;
- **Endpoint**: `router.get('/:idOrSlug/related', authenticateIfPresent, async (req: AuthRequest, res: Response) => {`
  - const product = await getFullProduct(pool, req.params.idOrSlug);
- **Endpoint**: `router.get('/:idOrSlug', authenticateIfPresent, async (req: AuthRequest, res: Response) => {`
  - const product = await getFullProduct(pool, req.params.idOrSlug, adminRead);
- **Endpoint**: `router.put('/reorder', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {`
  - const updates = req.body as { id: string; displayOrder: number }[];
- **Endpoint**: `router.post('/', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {`
  - const body = req.body;
- **Endpoint**: `router.put('/:id', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {`
  - const [existingRows] = await conn.execute(`SELECT ${PRODUCT_COLS} FROM products WHERE id = ?`, [req.params.id]);
  - const body = { ...parseJson(JSON.stringify(current), {}), ...req.body };
  - const [dupRows] = await conn.execute('SELECT id FROM products WHERE slug = ? AND id != ?', [slug, req.params.id]);
- **Endpoint**: `router.delete('/:id', authenticateToken, requireAdmin, async (req: Request, res: Response) => {`
  - const [rows] = await conn.execute('SELECT id FROM products WHERE id = ?', [req.params.id]);
  - await conn.execute('DELETE FROM products WHERE id = ?', [req.params.id]);


### FILE: reviews.ts
- **Endpoint**: `router.get('/product/:productId', async (req: Request, res: Response) => {`
  - const { productId } = req.params;
- **Endpoint**: `router.post('/', async (req: Request, res: Response) => {`
  - const { productId, productName, reviewerName, reviewerEmail, rating, title, content } = req.body;
- **Endpoint**: `router.get('/admin', authenticateToken, requireAdmin, async (req: Request, res: Response) => {`
  - const { status, source, rating, search, productId, page = 1, limit = 50 } = req.query;
- **Endpoint**: `router.post('/admin', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {`
  - const { productId, productName, reviewerName, rating, title, content, avatarUrl, imageUrl, imagePublicId, verifiedPurchase } = req.body;
- **Endpoint**: `router.put('/:id/approve', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {`
  - ['approved', now, req.user?.email || 'admin', now, req.params.id]
  - const [rows] = await pool.execute(`SELECT ${REVIEW_COLS_ADMIN} FROM reviews WHERE id = ?`, [req.params.id]);
- **Endpoint**: `router.put('/:id/reject', authenticateToken, requireAdmin, async (req: Request, res: Response) => {`
  - ['rejected', new Date(), req.params.id]
  - const [rows] = await pool.execute(`SELECT ${REVIEW_COLS_ADMIN} FROM reviews WHERE id = ?`, [req.params.id]);
- **Endpoint**: `router.put('/:id', authenticateToken, requireAdmin, async (req: Request, res: Response) => {`
  - const { reviewerName, rating, title, content, avatarUrl, verifiedPurchase } = req.body;
  - params.push(req.params.id);
  - const [rows] = await pool.execute(`SELECT ${REVIEW_COLS_ADMIN} FROM reviews WHERE id = ?`, [req.params.id]);
- **Endpoint**: `router.delete('/:id', authenticateToken, requireAdmin, async (req: Request, res: Response) => {`
  - const [rows] = await pool.execute('SELECT productId, status FROM reviews WHERE id = ?', [req.params.id]);
  - await pool.execute('DELETE FROM reviews WHERE id = ?', [req.params.id]);


### FILE: settings.ts
- **Endpoint**: `router.get('/', async (_req: Request, res: Response) => {`
- **Endpoint**: `router.put('/', authenticateToken, requireAdmin, async (req: Request, res: Response) => {`
  - const storeName = cleanText(req.body.storeName, 100);
  - const email = cleanText(req.body.email, 160).toLowerCase();
  - const phone = cleanText(req.body.phone, 60);
  - const address = cleanText(req.body.address, 240);
  - const currency = cleanText(req.body.currency, 12);
  - const defaultMetaTitle = cleanText(req.body.metaTitle ?? req.body.defaultMetaTitle, 70);
  - const defaultMetaDescription = cleanText(req.body.metaDescription ?? req.body.defaultMetaDescription, 180);
- **Endpoint**: `router.put('/social', authenticateToken, requireAdmin, async (req: Request, res: Response) => {`
  - const newSocial = { ...currentSocial, ...req.body.socialLinks };


### FILE: upload.ts
- **Endpoint**: `router.post(`
- **Endpoint**: `router.post(`
- **Endpoint**: `router.post(`
- **Endpoint**: `router.delete(`
  - const publicId = typeof req.body?.publicId === 'string' ? req.body.publicId.trim() : '';
- **Endpoint**: `router.post(`
- **Endpoint**: `router.delete(`
  - const publicId = typeof req.body?.publicId === 'string' ? req.body.publicId.trim() : '';
