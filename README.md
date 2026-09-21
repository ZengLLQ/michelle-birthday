# Michelle's birthday

A minimal lavender birthday page for Michelle Adeline Wijaya, with a real-time 3D cake, floating foil stars, pointer movement, and a candle celebration.

## Preview locally

With Node.js installed, run:

```sh
node serve.mjs
```

Open http://127.0.0.1:5173. The static website is in `dist/`; no build or package installation is required. Fonts and Three.js are served locally.

## Interactions

- Click or tap the cake or sparkle button to blow out the candle and release confetti. The candle relights automatically.
- Use the top-right control to pause or resume motion.
- Keyboard users can Tab to the controls and activate them with Enter or Space.
- The page honors the system's reduced-motion preference. Its message remains readable without WebGL or JavaScript.

The message is in `dist/index.html`, the layout in `dist/style.css`, and the Three.js scene in `dist/scene.js`. The hosting identity is in `.openai/hosting.json`.

Three.js is provided under the MIT License. DM Sans and Instrument Serif are provided under the SIL Open Font License; their license files accompany the assets.
