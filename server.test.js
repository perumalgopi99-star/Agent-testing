const request = require('supertest');
const { app, links } = require('./server');

describe('URL Shortener API', () => {
  beforeEach(() => {
    // Clear the in-memory store before each test
    links.clear();
  });

  describe('POST /api/shorten', () => {
    it('should shorten a valid URL with a generated code', async () => {
      const response = await request(app)
        .post('/api/shorten')
        .send({ url: 'https://example.com' });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('shortCode');
      expect(response.body).toHaveProperty('shortUrl');
      expect(response.body).toHaveProperty('originalUrl', 'https://example.com');
      expect(response.body).toHaveProperty('createdAt');
      expect(response.body.shortCode).toMatch(/^[a-zA-Z0-9]{6}$/);
    });

    it('should shorten a URL with a custom alias', async () => {
      const response = await request(app)
        .post('/api/shorten')
        .send({
          url: 'https://example.com',
          customAlias: 'mylink',
        });

      expect(response.status).toBe(201);
      expect(response.body.shortCode).toBe('mylink');
      expect(response.body.shortUrl).toContain('/mylink');
    });

    it('should return 400 if URL is missing', async () => {
      const response = await request(app).post('/api/shorten').send({});

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'URL is required');
    });

    it('should return 400 for invalid URL format', async () => {
      const response = await request(app)
        .post('/api/shorten')
        .send({ url: 'not-a-valid-url' });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Invalid URL format');
    });

    it('should return 400 for URL without protocol', async () => {
      const response = await request(app)
        .post('/api/shorten')
        .send({ url: 'example.com' });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Invalid URL format');
    });

    it('should return 409 if custom alias is already taken', async () => {
      // First request with custom alias
      await request(app)
        .post('/api/shorten')
        .send({
          url: 'https://example.com',
          customAlias: 'duplicate',
        });

      // Second request with same alias
      const response = await request(app)
        .post('/api/shorten')
        .send({
          url: 'https://another.com',
          customAlias: 'duplicate',
        });

      expect(response.status).toBe(409);
      expect(response.body).toHaveProperty('error', 'Alias already taken');
    });

    it('should accept various URL formats', async () => {
      const urls = [
        'https://example.com/path/to/resource',
        'https://example.com:8080/api',
        'http://localhost:3000/test',
        'https://example.com?param=value&other=123',
        'https://example.com#section',
      ];

      for (const url of urls) {
        const response = await request(app)
          .post('/api/shorten')
          .send({ url });

        expect(response.status).toBe(201);
        expect(response.body.originalUrl).toBe(url);
      }
    });
  });

  describe('GET /:shortCode', () => {
    it('should redirect to the original URL', async () => {
      // Create a shortened link
      await request(app)
        .post('/api/shorten')
        .send({
          url: 'https://example.com',
          customAlias: 'test123',
        });

      // Follow redirect
      const response = await request(app)
        .get('/test123')
        .redirects(1);

      expect(response.status).toBe(200);
      expect(response.redirects).toContain('https://example.com/');
    });

    it('should increment the click count', async () => {
      // Create a shortened link
      await request(app)
        .post('/api/shorten')
        .send({
          url: 'https://example.com',
          customAlias: 'click-test',
        });

      // Verify initial click count is 0
      let linksResponse = await request(app).get('/api/links');
      expect(linksResponse.body[0].clickCount).toBe(0);

      // Access the short link
      await request(app).get('/click-test').redirects(1);

      // Verify click count incremented to 1
      linksResponse = await request(app).get('/api/links');
      expect(linksResponse.body[0].clickCount).toBe(1);

      // Access again
      await request(app).get('/click-test').redirects(1);

      // Verify click count incremented to 2
      linksResponse = await request(app).get('/api/links');
      expect(linksResponse.body[0].clickCount).toBe(2);
    });

    it('should return 404 for unknown short code', async () => {
      const response = await request(app)
        .get('/unknowncode')
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Short URL not found');
    });
  });

  describe('GET /api/links', () => {
    it('should return an empty array when no links exist', async () => {
      const response = await request(app).get('/api/links');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(0);
    });

    it('should return all created links', async () => {
      // Create multiple links
      await request(app)
        .post('/api/shorten')
        .send({ url: 'https://example1.com', customAlias: 'link1' });

      await request(app)
        .post('/api/shorten')
        .send({ url: 'https://example2.com', customAlias: 'link2' });

      const response = await request(app).get('/api/links');

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
      expect(response.body[0]).toHaveProperty('shortCode');
      expect(response.body[0]).toHaveProperty('originalUrl');
      expect(response.body[0]).toHaveProperty('createdAt');
      expect(response.body[0]).toHaveProperty('clickCount');
    });

    it('should sort links by clickCount in descending order', async () => {
      // Create links
      await request(app)
        .post('/api/shorten')
        .send({ url: 'https://example1.com', customAlias: 'link1' });

      await request(app)
        .post('/api/shorten')
        .send({ url: 'https://example2.com', customAlias: 'link2' });

      await request(app)
        .post('/api/shorten')
        .send({ url: 'https://example3.com', customAlias: 'link3' });

      // Add clicks to links
      await request(app).get('/link3').redirects(1); // 1 click
      await request(app).get('/link3').redirects(1); // 2 clicks
      await request(app).get('/link3').redirects(1); // 3 clicks

      await request(app).get('/link2').redirects(1); // 1 click
      await request(app).get('/link2').redirects(1); // 2 clicks

      // link1 has 0 clicks

      const response = await request(app).get('/api/links');

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(3);
      expect(response.body[0].shortCode).toBe('link3'); // 3 clicks
      expect(response.body[0].clickCount).toBe(3);
      expect(response.body[1].shortCode).toBe('link2'); // 2 clicks
      expect(response.body[1].clickCount).toBe(2);
      expect(response.body[2].shortCode).toBe('link1'); // 0 clicks
      expect(response.body[2].clickCount).toBe(0);
    });
  });

  describe('DELETE /api/links/:shortCode', () => {
    it('should delete a shortened link', async () => {
      // Create a link
      await request(app)
        .post('/api/shorten')
        .send({
          url: 'https://example.com',
          customAlias: 'delete-test',
        });

      // Verify link exists
      let response = await request(app).get('/api/links');
      expect(response.body).toHaveLength(1);

      // Delete the link
      response = await request(app)
        .delete('/api/links/delete-test')
        .expect(204);

      // Verify link is gone
      response = await request(app).get('/api/links');
      expect(response.body).toHaveLength(0);
    });

    it('should return 404 when deleting non-existent link', async () => {
      const response = await request(app)
        .delete('/api/links/nonexistent')
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Short URL not found');
    });

    it('should allow recreating a deleted short code', async () => {
      // Create and delete a link
      await request(app)
        .post('/api/shorten')
        .send({
          url: 'https://example1.com',
          customAlias: 'reuse',
        });

      await request(app).delete('/api/links/reuse');

      // Recreate with same code pointing to different URL
      const response = await request(app)
        .post('/api/shorten')
        .send({
          url: 'https://example2.com',
          customAlias: 'reuse',
        });

      expect(response.status).toBe(201);
      expect(response.body.originalUrl).toBe('https://example2.com');
    });
  });

  describe('Integration Tests', () => {
    it('should handle a complete user flow', async () => {
      // 1. Shorten a URL
      const shortenResponse = await request(app)
        .post('/api/shorten')
        .send({
          url: 'https://github.com/user/repo',
          customAlias: 'github',
        });

      expect(shortenResponse.status).toBe(201);
      const shortCode = shortenResponse.body.shortCode;

      // 2. Retrieve all links
      let linksResponse = await request(app).get('/api/links');
      expect(linksResponse.body).toHaveLength(1);
      expect(linksResponse.body[0].clickCount).toBe(0);

      // 3. Click the link multiple times
      for (let i = 0; i < 5; i++) {
        await request(app).get(`/${shortCode}`).redirects(1);
      }

      // 4. Verify clicks were counted
      linksResponse = await request(app).get('/api/links');
      expect(linksResponse.body[0].clickCount).toBe(5);

      // 5. Create another link
      await request(app)
        .post('/api/shorten')
        .send({
          url: 'https://google.com',
          customAlias: 'search',
        });

      linksResponse = await request(app).get('/api/links');
      expect(linksResponse.body).toHaveLength(2);

      // 6. Verify sorting by clicks (github should be first)
      expect(linksResponse.body[0].shortCode).toBe('github');
      expect(linksResponse.body[0].clickCount).toBe(5);

      // 7. Delete a link
      await request(app).delete(`/api/links/${shortCode}`).expect(204);

      linksResponse = await request(app).get('/api/links');
      expect(linksResponse.body).toHaveLength(1);
    });
  });

  describe('Edge Cases', () => {
    it('should handle URLs with query parameters and fragments', async () => {
      const url = 'https://example.com/search?q=test&sort=date#results';
      const response = await request(app)
        .post('/api/shorten')
        .send({ url });

      expect(response.status).toBe(201);
      expect(response.body.originalUrl).toBe(url);
    });

    it('should handle very long URLs', async () => {
      const longUrl = 'https://example.com/' + 'a'.repeat(1000);
      const response = await request(app)
        .post('/api/shorten')
        .send({ url: longUrl });

      expect(response.status).toBe(201);
      expect(response.body.originalUrl).toBe(longUrl);
    });

    it('should generate unique short codes for multiple requests', async () => {
      const codes = new Set();

      for (let i = 0; i < 10; i++) {
        const response = await request(app)
          .post('/api/shorten')
          .send({ url: `https://example${i}.com` });

        codes.add(response.body.shortCode);
      }

      // All 10 codes should be unique
      expect(codes.size).toBe(10);
    });

    it('should handle custom aliases with various characters', async () => {
      const aliases = ['my-link', 'my_link', 'mylink123', 'MYLINK'];

      for (const alias of aliases) {
        const response = await request(app)
          .post('/api/shorten')
          .send({
            url: `https://example.com/${alias}`,
            customAlias: alias,
          });

        expect(response.status).toBe(201);
        expect(response.body.shortCode).toBe(alias);
      }

      const allLinksResponse = await request(app).get('/api/links');
      expect(allLinksResponse.body).toHaveLength(4);
    });
  });
});
