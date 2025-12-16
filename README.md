<p align="center">
  <img src="assets/preview.jpeg" alt="3D Earth Exporter Preview" width="100%" style="border-radius: 8px;" />
</p>

<h1 align="center">🌍 Google Earth 3D Exporter CLI</h1>

<p align="center">
  A powerful command-line tool for exporting textured 3D data from <strong>Google Earth</strong> using octant-based tiles.  
  Works out of the box for macOS, Windows and Linux — either via local development or prebuilt binaries.
</p>

---

## ✨ Features

- Export high-quality textured 3D geometry from Google Earth
- Octant-based selection for accurate region export
- Built-in CLI for cross-platform use
- Written in TypeScript for better maintainability and type safety
- Based on the excellent work of [retroplasma/earth-reverse-engineering](https://github.com/retroplasma/earth-reverse-engineering)

---

## 📦 Requirements

Before you get started, make sure you have the following installed:

- [Node.js (>=18)](https://nodejs.org/)
- [npm](https://www.npmjs.com/)
- [git](https://git-scm.com/)

---

## 🚀 Getting Started

Clone the repository:

```bash
git clone https://github.com/your-username/node-earth-export.git
cd node-earth-export
```

Install dependencies:

```bash
npm install
```

---

## 🗺️ Exporting 3D Area

You can export a region using latitude and longitude bounds.

> [!NOTE]
> 📌 **Note**: Google Earth uses _octants_ to load tiles. You can enable octant grid via:
> `View > Show Grid` or press `Cmd + G` / `Ctrl + G`. The area for export is formed by two diagonal corners of the bounding box as in the example in the photo below.

  <img src="assets/select-aria.jpeg" alt="3D Earth Exporter Preview" width="100%" style="border-radius: 8px;" />

> To run export you have to paste coordinates as following: `--bbox='SouthWest,NorthEast'` (`--bbox='minLat,minLng,maxLat,maxLng'`)

> For example: `--bbox='43.72247467873372,10.392798185348513,43.72386257277956,10.396832227706911'`

> You can select exported aria and copy valid coordinates, using this tools: [Map Bridge Web Interface](https://github.com/KIWIbird717/_Map-Bridge-Web-Interface), [OSM Export](https://www.openstreetmap.org/export)

Run:

Use bbox format

```bash
npx ts-node ./src/index.ts --bbox='43.72247467873372,10.392798185348513,43.72386257277956,10.396832227706911'
```

---

## 🛠 Build Standalone Binary

You can compile the entire project into a single executable file for your platform.

```bash
npm install -g pkg
npm run pkg
```

This will produce binaries for macOS, Windows, and Linux in the `build/` directory:

```bash
./build/earth-exporter-macos
./build/earth-exporter-win.exe
./build/earth-exporter-linux
```

Now you can use it without installing Node.js:

```bash
./build/earth-exporter-macos --bbox="..."
```

---

## 📸 Screenshots

<p align="center">
  <img src="assets/screenshot5.jpeg" width="600" alt="Exported Model Preview" style="border-radius: 8px;" />
  <img src="assets/screenshot4.jpeg" width="600" alt="Exported Model Preview" style="border-radius: 8px;" />
  <img src="assets/screenshot3.jpeg" width="600" alt="Exported Model Preview" style="border-radius: 8px;" />
  <img src="assets/screenshot2.jpeg" width="600" alt="Exported Model Preview" style="border-radius: 8px;" />
  <img src="assets/screenshot1.jpeg" width="600" alt="Exported Model Preview" style="border-radius: 8px;" />
</p>

## 🙏 Credits

- Based on [retroplasma/earth-reverse-engineering](https://github.com/retroplasma/earth-reverse-engineering)
- Thanks to contributors and the open-source GIS/3D tooling community!
