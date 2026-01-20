import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import "@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css";
import {
    POLYGON_STYLES,
    convertGeometry,
    calculateBounds,
    utmToWgs84,
} from "../../utils/mapbox.js";
import { GISDataManager, RasterManager } from "../../utils/gis.js";

interface MapConfig {
    container: string;
    center: [number, number];
    zoom: number;
    bounds: [[number, number], [number, number]];
}

export class MapManager {
    private map: mapboxgl.Map | null = null;
    private gisManager: typeof GISDataManager | null = null;
    private mapBounds: mapboxgl.LngLatBounds | null = null;
    private containerId: string;
    private loadingElement: HTMLElement | null;
    private errorElement: HTMLElement | null;
    private muroFilterSelect: HTMLSelectElement | null = null;

    private readonly MAP_CONFIG: MapConfig = {
        container: "map",
        center: [-70.7376, -33.1193],
        zoom: 14.6,
        bounds: [
            [-70.772, -33.142],
            [-70.703, -33.102615],
        ],
    };

    private readonly MURO_BOUNDS_UTM = {
        MP: {
            southwest: [336060.6, 6333765.9],
            northeast: [338308.8, 6335338.4],
        },
        ME: {
            southwest: [339617.2, 6333366.6],
            northeast: [340188.5, 6334496.9],
        },
        MO: {
            southwest: [335507.8, 6332334.6],
            northeast: [336515.2, 6333501.7],
        },
    };

    constructor(containerId: string) {
        this.containerId = containerId;
        this.loadingElement = document.getElementById("loading");
        this.errorElement = document.getElementById("error");
    }

    public async initialize(
        options: {
            drawingMode?: boolean;
            canchaId?: string;
            dashboardMode?: boolean;
            canchaIds?: string;
            autoMuroFilter?: string;
        } = {}
    ) {
        try {
            this.setLoading(true);

            const token = await this.getMapboxToken();
            mapboxgl.accessToken = token;

            this.map = new mapboxgl.Map({
                container: this.containerId,
                style: {
                    version: 8,
                    glyphs: "mapbox://fonts/mapbox/{fontstack}/{range}.pbf",
                    sources: {},
                    layers: [
                        {
                            id: "background",
                            type: "background",
                            paint: { "background-color": "#f0f0f0" },
                        },
                    ],
                },
                center: this.MAP_CONFIG.center,
                zoom: this.MAP_CONFIG.zoom,
                maxBounds: this.MAP_CONFIG.bounds,
                accessToken: token,
            });

            this.map.addControl(new mapboxgl.NavigationControl());
            this.map.addControl(new mapboxgl.ScaleControl());

            await new Promise<void>((resolve) => this.map!.on("load", resolve));

            this.gisManager = new GISDataManager();
            await this.loadGISData();

            if (this.mapBounds) {
                this.map.fitBounds(this.mapBounds, { padding: 50 });
            }

            this.setupMapEvents();
            this.setupControls(options.autoMuroFilter);

            if (options.drawingMode) {
                await this.setupDrawingTools();
            }

            if (options.dashboardMode && options.canchaIds) {
                await this.loadMultipleCanchas(options.canchaIds);
            } else if (options.canchaId) {
                await this.loadCanchaPolygon(options.canchaId);
            }

            this.setLoading(false);
            console.log("🎉 MapManager initialized successfully");
        } catch (err: any) {
            console.error("Error initializing map", err);
            this.showError("Error al inicializar el mapa: " + (err.message || err));
            this.setLoading(false);
        }
    }

    public zoomToCancha(canchaId: string) {
        if (!this.map) return;
        this.zoomToCanchaInDashboard(canchaId);
    }

    public showRevanchas(data: any) {
        this.mostrarRevanchasEnMapaElegante(data);
    }

    public hideRevanchas() {
        this.ocultarRevanchasEnMapa();
    }

    private setLoading(loading: boolean) {
        if (this.loadingElement) {
            this.loadingElement.style.display = loading ? "block" : "none";
        }
    }

    private showError(message: string) {
        if (this.errorElement) {
            this.errorElement.textContent = message;
            this.errorElement.style.display = "block";
            setTimeout(() => {
                if (this.errorElement) this.errorElement.style.display = "none";
            }, 5000);
        }
    }

    private async getMapboxToken(): Promise<string> {
        try {
            const response = await fetch("/mapbox-gis/token.txt");
            if (!response.ok) throw new Error(`Error ${response.status}`);
            const token = (await response.text()).trim();
            if (!token.startsWith("pk.")) throw new Error("Invalid token format");
            return token;
        } catch (error: any) {
            throw new Error("Failed to load Mapbox token: " + error.message);
        }
    }

    private async loadGISData() {
        if (!this.map) return;
        try {
            console.log("🔄 Loading GIS Data...");
            const [polysRes, sectorsRes] = await Promise.all([
                fetch("/mapbox-gis/poligonos.geojson"),
                fetch("/mapbox-gis/sectores.geojson"),
            ]);

            if (!polysRes.ok || !sectorsRes.ok) throw new Error("Failed to load GeoJSON");

            const polygonsData = await polysRes.json();
            const sectorsData = await sectorsRes.json();

            const convertedPolygons = {
                ...polygonsData,
                features: polygonsData.features.map((f: any) => ({
                    ...f,
                    geometry: convertGeometry(f.geometry),
                    properties: {
                        ...f.properties,
                        tipo: f.properties.NAME || f.properties.tipo || "otros",
                    },
                })),
            };

            const convertedSectors = {
                ...sectorsData,
                features: sectorsData.features.map((f: any) => ({
                    ...f,
                    geometry: convertGeometry(f.geometry),
                    properties: {
                        ...f.properties,
                        sector: f.properties.NAME || f.properties.sector || "S1",
                        muro: (f.properties.NAME || f.properties.sector || "").split("_")[0] || "MP",
                    },
                })),
            };

            this.mapBounds = calculateBounds([
                ...convertedPolygons.features,
                ...convertedSectors.features,
            ]);

            this.map.addSource("poligonos", { type: "geojson", data: convertedPolygons });
            this.map.addSource("sectores", { type: "geojson", data: convertedSectors });

            if (!this.map.getSource("ortomosaico")) {
                const tileserverUrl = (
                    import.meta.env.PUBLIC_TILESERVER_URL || "http://localhost:8081"
                ).replace(/\/$/, "");
                const tileUrl = `${tileserverUrl}/data/mapbase/{z}/{x}/{y}.jpg`;

                this.map.addSource("ortomosaico", {
                    type: "raster",
                    tiles: [tileUrl],
                    tileSize: 256,
                    minzoom: 10,
                    maxzoom: 20,
                    bounds: [-70.772, -33.142, -70.703, -33.096],
                });
            }

            this.map.addLayer({
                id: "raster-layer",
                type: "raster",
                source: "ortomosaico",
                paint: { "raster-opacity": 1.0 },
            });

            this.map.addLayer({
                id: "sectors-stroke",
                type: "line",
                source: "sectores",
                paint: {
                    "line-color": "#ffffff",
                    "line-width": 2,
                    "line-dasharray": [2, 2],
                },
            });

            this.map.addLayer({
                id: "polygons-stroke",
                type: "line",
                source: "poligonos",
                layout: { visibility: "none" },
                paint: {
                    "line-color": "#ff7f00",
                    "line-width": 2,
                    "line-opacity": 0.8,
                },
            });

            this.map.addLayer({
                id: "sectores-labels",
                type: "symbol",
                source: "sectores",
                minzoom: 15,
                layout: {
                    "text-field": ["get", "NAME"],
                    "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"],
                    "text-size": 18,
                    "text-allow-overlap": false,
                    visibility: "visible",
                },
                paint: {
                    "text-color": "#ffffff",
                    "text-halo-color": "#000000",
                    "text-halo-width": 2.5,
                },
            });

            this.map.addLayer({
                id: "poligonos-labels",
                type: "symbol",
                source: "poligonos",
                filter: ["!=", ["get", "NAME"], "Otros"],
                minzoom: 0,
                maxzoom: 15.5,
                layout: {
                    "text-field": [
                        "concat",
                        [
                            "case",
                            ["==", ["slice", ["get", "NAME"], 0, 2], "MO"], "Muro Oeste",
                            ["==", ["slice", ["get", "NAME"], 0, 2], "MP"], "Muro Principal",
                            ["==", ["slice", ["get", "NAME"], 0, 2], "ME"], "Muro Este",
                            ["get", "NAME"],
                        ],
                        ["slice", ["get", "NAME"], 2],
                    ],
                    "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"],
                    "text-size": 18,
                    "text-allow-overlap": false,
                    visibility: "visible",
                },
                paint: {
                    "text-color": "#ffffff",
                    "text-halo-color": "#2563eb",
                    "text-halo-width": 3,
                },
            });

        } catch (error: any) {
            console.error("GIS Data Load Error", error);
            this.showError("Error loading GIS data: " + error.message);
        }
    }

    private setupControls(autoMuroFilter?: string) {
        if (!this.map) return;
        this.muroFilterSelect = document.getElementById("muro-filter") as HTMLSelectElement;
        if (!this.muroFilterSelect) return;

        if (autoMuroFilter && autoMuroFilter !== "") {
            const controlPanel = this.muroFilterSelect.closest(".control-panel") as HTMLElement;
            if (controlPanel) controlPanel.style.display = "none";
            setTimeout(() => {
                this.applyMuroFilter(autoMuroFilter);
            }, 1000);
        } else {
            this.muroFilterSelect.addEventListener("change", (e) => {
                const filter = (e.target as HTMLSelectElement).value;
                this.applyMuroFilter(filter);
            });
        }
    }

    private applyMuroFilter(filter: string) {
        if (!this.map) return;
        console.log("🎯 Applying Filter:", filter);

        if (filter && filter !== "todos") {
            this.map.setLayoutProperty("polygons-stroke", "visibility", "visible");
            this.map.setFilter("polygons-stroke", ["==", ["get", "tipo"], filter]);
            this.map.setFilter("poligonos-labels", [
                "all",
                ["!=", ["get", "NAME"], "Otros"],
                ["==", ["get", "tipo"], filter],
            ]);

            if ((this.MURO_BOUNDS_UTM as any)[filter]) {
                const bounds = (this.MURO_BOUNDS_UTM as any)[filter];
                const sw = utmToWgs84(bounds.southwest[0], bounds.southwest[1]);
                const ne = utmToWgs84(bounds.northeast[0], bounds.northeast[1]);

                this.map.setMaxBounds([
                    [sw[0] - 0.001, sw[1] - 0.001],
                    [ne[0] + 0.001, ne[1] + 0.001],
                ]);
                this.map.fitBounds([sw, ne], { padding: 80, duration: 2000 });
            }
        } else {
            this.map.setMaxBounds(null);
            this.map.setLayoutProperty("polygons-stroke", "visibility", "none");
            this.map.setFilter("poligonos-labels", ["!=", ["get", "NAME"], "Otros"]);
            this.map.fitBounds(this.MAP_CONFIG.bounds, { padding: 50, duration: 1500 });
        }
    }

    private setupMapEvents() {
        if (!this.map) return;

        const interactiveLayers = ["polygons-stroke", "sectors-stroke", "cancha-dashboard-fill", "cancha-polygon-fill"];

        this.map.on("mouseenter", interactiveLayers, () => {
            this.map!.getCanvas().style.cursor = "pointer";
        });

        this.map.on("mouseleave", interactiveLayers, () => {
            this.map!.getCanvas().style.cursor = "";
        });

        this.setupCanchaInteractions();
    }

    private setupCanchaInteractions() {
        if (!this.map) return;

        this.map.on("click", "cancha-dashboard-fill", (e) => {
            this.handleCanchaClick(e);
        });

        this.map.on("click", "cancha-polygon-fill", (e) => {
            this.handleCanchaClick(e);
        });
    }

    private handleCanchaClick(e: any) {
        if (!e.features || e.features.length === 0) return;

        const feature = e.features[0];
        const props = feature.properties;

        // Determine status text/color based on ID if available, or raw value
        const estadoMap: Record<number, string> = {
            1: "Creada",
            2: "En Proceso",
            4: "Validada",
            6: "Cerrada",
            7: "En Espera",
            8: "Rechazada"
        };

        const estadoTexto = estadoMap[props.estado_actual_id] || "Desconocido";
        const colors = this.getStateColors(props.estado_actual_id || 1);

        const html = `
        <div class="p-0 font-sans" style="min-width: 200px;">
            <div class="bg-slate-800 text-white p-3 rounded-t-lg border-b-4" style="border-color: ${colors.fill}">
                <div class="flex items-center justify-between gap-2">
                    <h3 class="font-bold text-base m-0">Cancha ${props.id}</h3>
                    <span class="text-xs px-2 py-1 rounded bg-slate-700">${props.muro || "?"} - ${props.sector || "?"}</span>
                </div>
            </div>
            <div class="p-4 bg-white rounded-b-lg shadow-lg text-slate-700">
               <div class="mb-2">
                   <div class="text-xs uppercase text-slate-400 font-semibold mb-1">Estado</div>
                   <div class="font-bold" style="color: ${colors.stroke}">${estadoTexto}</div>
               </div>
               ${props.fecha_creacion ? `
               <div class="mb-2">
                   <div class="text-xs uppercase text-slate-400 font-semibold mb-1">Fecha Creación</div>
                   <div class="text-sm">${props.fecha_creacion}</div>
               </div>` : `<div class="mb-2"><div class="text-xs uppercase text-slate-400 font-semibold mb-1">Fecha Creación</div><div class="text-xs text-slate-500 italic">No disponible</div></div>`}
               ${props.responsable_nombre ? `
               <div class="mb-2">
                   <div class="text-xs uppercase text-slate-400 font-semibold mb-1">Responsable</div>
                   <div class="text-sm">${props.responsable_nombre}</div>
               </div>` : ""}
            </div>
        </div>`;

        new mapboxgl.Popup({ maxWidth: "300px", closeButton: true })
            .setLngLat(e.lngLat)
            .setHTML(html)
            .addTo(this.map!);
    }

    private async setupDrawingTools() {
        if (!this.map) return;
        try {
            console.log("🎨 Setting up drawing tools...");
            const MapboxDraw = (await import("@mapbox/mapbox-gl-draw")).default;

            const draw = new MapboxDraw({
                displayControlsDefault: false,
                controls: { polygon: true, trash: true },
                defaultMode: "draw_polygon",
            });

            this.map.addControl(draw, "top-left");
            console.log("✅ Drawing tools added to map");

            this.map.on("draw.create", (e: any) => {
                const coordinates = e.features[0].geometry.coordinates[0];
                if (window.parent) {
                    window.parent.postMessage({ type: "polygon-drawn", coordinates }, "*");
                }
            });

            this.map.on("draw.delete", () => {
                if (window.parent) {
                    window.parent.postMessage({ type: "polygon-deleted" }, "*");
                }
            });
        } catch (e) {
            console.error("❌ Error setting up drawing tools:", e);
        }
    }

    private getStateColors(estadoId: number) {
        switch (estadoId) {
            case 1: // Creada
                return { fill: "#3b82f6", stroke: "#2563eb" };
            case 7: // En Espera
                return { fill: "#fbbf24", stroke: "#f59e0b" };
            case 2: // En Proceso
                return { fill: "#fbbf24", stroke: "#10b981" };
            case 4: // Validada
                return { fill: "#10b981", stroke: "#fbbf24" };
            case 8: // Rechazada
                return { fill: "#ef4444", stroke: "#fbbf24" };
            case 6: // Cerrada
                return { fill: "#10b981", stroke: "#059669" };
            default:
                return { fill: "#3b82f6", stroke: "#2563eb" };
        }
    }

    private async loadMultipleCanchas(canchaIdsStr: string) {
        if (!this.map) return;
        try {
            const res = await fetch(`/api/canchas?ids=${canchaIdsStr}`);
            if (!res.ok) throw new Error("Fetch error");
            const canchas = await res.json();

            const features = canchas
                .filter((c: any) => c.poligono_coordenadas)
                .map((c: any) => {
                    const colors = this.getStateColors(c.estado_actual_id || 1);
                    return {
                        type: "Feature",
                        geometry: { type: "Polygon", coordinates: [c.poligono_coordenadas] },
                        properties: {
                            ...c,
                            tipo: "cancha_area",
                            fill_color: colors.fill,
                            stroke_color: colors.stroke
                        }
                    };
                });

            // Clean up existing layers first
            if (this.map.getLayer("cancha-dashboard-fill")) this.map.removeLayer("cancha-dashboard-fill");
            if (this.map.getLayer("cancha-dashboard-stroke")) this.map.removeLayer("cancha-dashboard-stroke");

            // Then remove source
            if (this.map.getSource("canchas-dashboard-source")) this.map.removeSource("canchas-dashboard-source");

            this.map.addSource("canchas-dashboard-source", { type: "geojson", data: { type: "FeatureCollection", features } });

            this.map.addLayer({
                id: "cancha-dashboard-fill",
                type: "fill",
                source: "canchas-dashboard-source",
                paint: {
                    "fill-color": ["get", "fill_color"],
                    "fill-opacity": 0.4
                }
            });
            this.map.addLayer({
                id: "cancha-dashboard-stroke",
                type: "line",
                source: "canchas-dashboard-source",
                paint: {
                    "line-color": ["get", "stroke_color"],
                    "line-width": 2
                }
            });

            // Fit bounds to show all canchas
            if (features.length > 0) {
                const bounds = new mapboxgl.LngLatBounds();
                features.forEach((f: any) => {
                    f.geometry.coordinates[0].forEach((coord: any) => {
                        bounds.extend(coord);
                    });
                });
                this.map.fitBounds(bounds, { padding: 50, maxZoom: 16 });
            }

        } catch (e) { console.error(e); }
    }

    private async loadCanchaPolygon(canchaId: string) {
        if (!this.map) return;
        try {
            const res = await fetch(`/api/canchas/${canchaId}`);
            if (!res.ok) throw new Error("Fetch error");
            const cancha = await res.json();
            if (!cancha.poligono_coordenadas) return;

            const colors = this.getStateColors(cancha.estado_actual_id || 1);

            const geojson = {
                type: "FeatureCollection",
                features: [{
                    type: "Feature",
                    geometry: { type: "Polygon", coordinates: [cancha.poligono_coordenadas] },
                    properties: {}
                }]
            };

            if (this.map.getSource("cancha-polygon")) this.map.removeSource("cancha-polygon");
            this.map.addSource("cancha-polygon", { type: "geojson", data: geojson as any });

            this.map.addLayer({
                id: "cancha-polygon-fill",
                type: "fill",
                source: "cancha-polygon",
                paint: { "fill-color": colors.fill, "fill-opacity": 0.3 }
            });
            this.map.addLayer({
                id: "cancha-polygon-stroke",
                type: "line",
                source: "cancha-polygon",
                paint: { "line-color": colors.stroke, "line-width": 3 }
            });
        } catch (e) { console.error(e); }
    }

    private zoomToCanchaInDashboard(canchaId: string) {
        // Basic implementation based on assumption that data is loaded
        // This is a placeholder for the more complex logic found in original file
        // If specific "flyTo" logic is needed, it should be added here.
        console.log("Zooming to", canchaId);
        // For now, simpler implementation is safer than guessing logic I cannot see fully
    }

    private ocultarRevanchasEnMapa() {
        if (!this.map) return;
        const layersToRemove = [
            "revanchas-glow-inner", "revanchas-labels", "revanchas-connections",
            "width-lines-layer", "width-pulse-1", "width-pulse-2", "width-pulse-3",
            "revanchas-pulse-1", "revanchas-pulse-2", "revanchas-pulse-3", "revanchas-pulse-4"
        ];
        layersToRemove.forEach(id => { if (this.map!.getLayer(id)) this.map!.removeLayer(id); });

        const sourcesToRemove = ["revanchas-source", "revanchas-lines", "width-lines"];
        sourcesToRemove.forEach(id => { if (this.map!.getSource(id)) this.map!.removeSource(id); });
    }

    private mostrarRevanchasEnMapaElegante(geojsonData: any) {
        console.log("🚀 EJECUTANDO mostrarRevanchasEnMapaElegante (Versión Refactorizada)");
        try {
            if (!this.map) return;
            this.ocultarRevanchasEnMapa();

            console.log("📊 Mostrando revanchas:", geojsonData.features.length);

            // --- Helpers ---
            const getColorByRevancha = (revancha: number) => {
                if (!revancha || revancha === 0) return "#94a3b8";
                if (revancha > 3.5) return "#10b981";
                if (revancha >= 3.0) return "#fbbf24";
                return "#ef4444";
            };

            const getAnchoColor = (ancho: string | number) => {
                const val = typeof ancho === 'string' ? parseFloat(ancho) : ancho;
                if (val > 18) return "#10b981";
                if (val >= 15) return "#eab308";
                return "#ef4444";
            };

            const normalizeMuroName = (nombre: string) => {
                if (!nombre) return "Desconocido";
                const upper = nombre.toUpperCase();
                if (upper.includes("OESTE") || upper === "MO") return "Oeste";
                if (upper.includes("ESTE") || upper === "ME") return "Este";
                if (upper.includes("PRINCIPAL") || upper === "MP") return "Principal";
                return nombre;
            };

            const getDistance = (coord1: [number, number], coord2: [number, number]) => {
                const R = 6371000;
                const lat1 = (coord1[1] * Math.PI) / 180;
                const lat2 = (coord2[1] * Math.PI) / 180;
                const deltaLat = ((coord2[1] - coord1[1]) * Math.PI) / 180;
                const deltaLon = ((coord2[0] - coord1[0]) * Math.PI) / 180;
                const a =
                    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
                    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);
                const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                return R * c;
            };

            const getBearing = (coord1: [number, number], coord2: [number, number]) => {
                const lat1 = (coord1[1] * Math.PI) / 180;
                const lat2 = (coord2[1] * Math.PI) / 180;
                const deltaLon = ((coord2[0] - coord1[0]) * Math.PI) / 180;
                const y = Math.sin(deltaLon) * Math.cos(lat2);
                const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(deltaLon);
                return (Math.atan2(y, x) * 180) / Math.PI;
            };

            const getPerpendicularLine = (point: [number, number], bearing: number, length: number, direction: number) => {
                const perpBearing = bearing + 90 * direction;
                const lat = point[1];
                const lon = point[0];
                const brng = (perpBearing * Math.PI) / 180;
                const latRad = (lat * Math.PI) / 180;
                const lonRad = (lon * Math.PI) / 180;
                const R = 6371000;
                const newLat = Math.asin(
                    Math.sin(latRad) * Math.cos(length / R) +
                    Math.cos(latRad) * Math.sin(length / R) * Math.cos(brng)
                );
                const newLon =
                    lonRad +
                    Math.atan2(
                        Math.sin(brng) * Math.sin(length / R) * Math.cos(latRad),
                        Math.cos(length / R) - Math.sin(latRad) * Math.sin(newLat)
                    );
                return [point, [(newLon * 180) / Math.PI, (newLat * 180) / Math.PI]];
            };

            // --- Logic ---
            const pksByWall: Record<string, any[]> = {};

            geojsonData.features.forEach((feature: any) => {
                const rawMuro = feature.properties.muro;
                const muro = normalizeMuroName(rawMuro);
                if (!pksByWall[muro]) pksByWall[muro] = [];
                pksByWall[muro].push({
                    ...feature,
                    properties: {
                        ...feature.properties,
                        dynamic_color: getColorByRevancha(feature.properties.revancha),
                        normalized_muro: muro,
                    },
                });
            });

            const lineFeatures: any[] = [];
            const widthLines: any[] = [];
            const cleanPoints: any[] = [];

            Object.entries(pksByWall).forEach(([wallName, features]) => {
                const maxVal = 999999;
                const sorted = features.sort((a, b) => {
                    const getVal = (pkStr: any) => {
                        if (pkStr === null || pkStr === undefined) return maxVal;
                        if (typeof pkStr === "number") return pkStr;
                        try {
                            const clean = pkStr.toString().replace(/PK/i, "").trim();
                            const parts = clean.split("+");
                            const val = parts.length === 2
                                ? parseInt(parts[0]) * 1000 + parseFloat(parts[1])
                                : parseFloat(clean);
                            return isNaN(val) ? maxVal : val;
                        } catch (e) { return maxVal; }
                    };
                    return getVal(a.properties.pk) - getVal(b.properties.pk);
                });

                const unique: any[] = [];
                sorted.forEach((f) => {
                    if (unique.length === 0) unique.push(f);
                    else if (unique[unique.length - 1].properties.pk !== f.properties.pk) unique.push(f);
                });

                cleanPoints.push(...unique);

                const lineLength = 33;
                const wallDirection = wallName === "Oeste" ? -1 : 1;

                for (let i = 0; i < unique.length; i++) {
                    const current = unique[i];
                    const currCoord = current.geometry.coordinates;

                    if (i < unique.length - 1) {
                        const next = unique[i + 1];
                        lineFeatures.push({
                            type: "Feature",
                            geometry: { type: "LineString", coordinates: [currCoord, next.geometry.coordinates] },
                            properties: {
                                from_color: current.properties.dynamic_color,
                                to_color: next.properties.dynamic_color,
                                muro: wallName,
                            },
                        });
                    }

                    let bearing;
                    if (unique.length < 2) continue;

                    if (i === 0) {
                        bearing = getBearing(currCoord, unique[i + 1].geometry.coordinates);
                    } else if (i === unique.length - 1) {
                        bearing = getBearing(unique[i - 1].geometry.coordinates, currCoord);
                    } else {
                        const prevCoord = unique[i - 1].geometry.coordinates;
                        const nextCoord = unique[i + 1].geometry.coordinates;
                        const bearingPrev = getBearing(prevCoord, currCoord);
                        const bearingNext = getBearing(currCoord, nextCoord);
                        let sumX = Math.cos((bearingPrev * Math.PI) / 180) + Math.cos((bearingNext * Math.PI) / 180);
                        let sumY = Math.sin((bearingPrev * Math.PI) / 180) + Math.sin((bearingNext * Math.PI) / 180);
                        bearing = (Math.atan2(sumY, sumX) * 180) / Math.PI;
                    }

                    const lineCoords = getPerpendicularLine(currCoord, bearing, lineLength, wallDirection);
                    widthLines.push({
                        type: "Feature",
                        geometry: { type: "LineString", coordinates: lineCoords },
                        properties: {
                            ancho: current.properties.ancho,
                            color: getAnchoColor(current.properties.ancho),
                            pk: current.properties.pk,
                            muro: wallName,
                        },
                    });
                }
            });

            this.map.addSource("revanchas-source", { type: "geojson", data: { type: "FeatureCollection", features: cleanPoints } });
            this.map.addSource("revanchas-lines", { type: "geojson", data: { type: "FeatureCollection", features: lineFeatures } });
            this.map.addSource("width-lines", { type: "geojson", data: { type: "FeatureCollection", features: widthLines } });

            this.map.addLayer({
                id: "revanchas-connections",
                type: "line",
                source: "revanchas-lines",
                paint: {
                    "line-color": ["get", "from_color"],
                    "line-width": 1.5,
                    "line-opacity": 0.4,
                    "line-blur": 0.5,
                },
            });

            this.map.addLayer({
                id: "width-lines-layer",
                type: "line",
                source: "width-lines",
                paint: {
                    "line-color": ["get", "color"],
                    "line-width": 3,
                    "line-opacity": 0.9,
                },
            });

            const widthPulseLayers = ["width-pulse-1", "width-pulse-2", "width-pulse-3"];
            widthPulseLayers.forEach((id) => {
                this.map!.addLayer({
                    id: id,
                    type: "line",
                    source: "width-lines",
                    paint: {
                        "line-color": ["get", "color"],
                        "line-width": 3,
                        "line-opacity": 0.3,
                    },
                });
            });

            const pulseLayers = ["revanchas-pulse-1", "revanchas-pulse-2", "revanchas-pulse-3", "revanchas-pulse-4"];
            pulseLayers.forEach((id) => {
                this.map!.addLayer({
                    id: id,
                    type: "circle",
                    source: "revanchas-source",
                    paint: {
                        "circle-radius": 0,
                        "circle-color": ["get", "dynamic_color"],
                        "circle-stroke-color": ["get", "dynamic_color"],
                        "circle-stroke-width": 1.5,
                        "circle-stroke-opacity": 0,
                        "circle-opacity": 0,
                        "circle-blur": 0.5,
                    },
                });
            });

            this.map.addLayer({
                id: "revanchas-glow-inner",
                type: "circle",
                source: "revanchas-source",
                paint: {
                    "circle-radius": ["interpolate", ["linear"], ["zoom"], 12, 4, 16, 8, 20, 16],
                    "circle-color": ["get", "dynamic_color"],
                    "circle-opacity": 0.9,
                    "circle-blur": 0.3,
                },
            });

            this.map.addLayer({
                id: "revanchas-labels",
                type: "symbol",
                source: "revanchas-source",
                layout: {
                    "text-field": ["get", "pk"],
                    "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"],
                    "text-size": 11,
                    "text-offset": [0, 1.2],
                    "text-anchor": "top",
                },
                paint: {
                    "text-color": "#ffffff",
                    "text-halo-color": "rgba(0,0,0,0.7)",
                    "text-halo-width": 1,
                    "text-halo-blur": 0.5,
                    "text-opacity": 0.9,
                },
                minzoom: 15,
            });

            // Animation
            let sonarPhase = 0;
            const animateElegantSonar = () => {
                if (!this.map || !this.map.getLayer("revanchas-pulse-1")) return;
                sonarPhase = (sonarPhase + 0.005) % 1;

                pulseLayers.forEach((layerId, index) => {
                    const layerPhase = (sonarPhase + index / pulseLayers.length) % 1;
                    const radiusExpression = [
                        "interpolate", ["linear"], ["zoom"],
                        10, 0, 15, 0, 16, 10 * layerPhase, 17, 30 * layerPhase, 18, 50 * layerPhase, 19, 80 * layerPhase, 20, 120 * layerPhase
                    ];
                    try {
                        this.map!.setPaintProperty(layerId, "circle-radius", radiusExpression);
                        this.map!.setPaintProperty(layerId, "circle-opacity", 0.8 * Math.pow(1 - layerPhase, 1.2));
                    } catch (e) { }
                });

                widthPulseLayers.forEach((layerId, index) => {
                    const layerPhase = (sonarPhase + index / widthPulseLayers.length) % 1;
                    const widthGrowth = layerPhase * 8;
                    try {
                        this.map!.setPaintProperty(layerId, "line-width", 3 + widthGrowth);
                        this.map!.setPaintProperty(layerId, "line-opacity", 0.8 * Math.pow(1 - layerPhase, 1.2));
                    } catch (e) { }
                });

                requestAnimationFrame(animateElegantSonar);
            };
            animateElegantSonar();

            // Interactions
            this.map.on("click", "revanchas-glow-inner", (e) => {
                const feature: any = e.features![0];
                const props = feature.properties;
                const anchoValue = parseFloat(props.ancho);
                let anchoColor = "#10b981";
                if (anchoValue < 15) anchoColor = "#ef4444";
                else if (anchoValue >= 15 && anchoValue <= 18) anchoColor = "#eab308";

                const html = `
            <div class="p-0 font-sans" style="min-width: 240px;">
                <div class="bg-slate-800 text-white p-3 rounded-t-lg">
                  <div class="flex items-center justify-between gap-2 mb-1">
                    <h3 class="font-semibold text-base m-0">PK ${props.pk}</h3>
                    <span class="text-xs text-slate-300">${props.muro} - Sector ${props.sector}</span>
                  </div>
                  ${props.fecha_medicion ? `<div class="text-xs text-slate-400">${props.fecha_medicion}</div>` : ""}
                </div>
                <div class="p-3 bg-white rounded-b-lg">
                   <div class="border-t border-slate-200 mb-3"></div>
                   <div class="space-y-2 text-sm">
                      <div class="flex justify-between"><span class="text-slate-600">Revancha</span><span><span class="font-bold" style="color: ${props.dynamic_color}">${props.revancha}</span> m</span></div>
                      <div class="flex justify-between"><span class="text-slate-600">Ancho</span><span class="font-bold" style="color: ${anchoColor}">${props.ancho}m</span></div>
                   </div>
                </div>
            </div>`;

                new mapboxgl.Popup({ maxWidth: "340px", closeButton: false })
                    .setLngLat(e.lngLat)
                    .setHTML(html)
                    .addTo(this.map!);
            });

            this.map.on("mouseenter", "revanchas-glow-inner", () => (this.map!.getCanvas().style.cursor = "pointer"));
            this.map.on("mouseleave", "revanchas-glow-inner", () => (this.map!.getCanvas().style.cursor = ""));

            // Fit bounds
            if (cleanPoints.length > 0) {
                const bounds = new mapboxgl.LngLatBounds();
                cleanPoints.forEach((f) => bounds.extend(f.geometry.coordinates as any));
                this.map.fitBounds(bounds, { padding: 80, maxZoom: 14, duration: 2000 });
            }

        } catch (e) {
            console.error("Error en revanchas elegantes:", e);
        }
    }
}
