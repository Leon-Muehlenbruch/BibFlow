# Paper Search

OpenAlex-backed literature discovery. Each `## Section` below is one saved search. Edit the `keywords` / filters inside its ```` ```search ```` fence, then run the **Paper Search** Templater command (or `python3 "0 Meta/Library/fetch_search.py"` from your vault root). Results are written between `%% results-begin: <Section> %%` / `%% results-end: <Section> %%` markers directly under the fence — anything you type between those markers will be overwritten on the next run, so keep your own notes outside them.

Papers already in your `1 Literature/` library are detected by DOI match and marked with `✓`, with a link to the existing note.

## Syntax cheat sheet
Inside each ```` ```search ```` block you can set:

- `keywords:` — space-separated phrase (`cyanobacteria microbial carbonate`) OR a YAML list (`[cyanobacteria, microbial, carbonate]`). Multiple terms are OR-matched; OpenAlex ranks by relevance.
- `from_year:` / `to_year:` — integer bounds (inclusive). Either or both.
- `min_citations:` — minimum total citations.
- `max_results:` — 1–200, default 20.
- `type:` — OpenAlex work type (`article`, `review`, `book-chapter`, …).
- `sort_by:` — `relevance` (default), `citations`, or `date`.

To add a new search, copy an existing `## Section` block and change the name + keywords. Section names must be unique — duplicates get auto-suffixed with `(2)`, `(3)`, etc.

---

## Cyanobacteria MICP
```search
keywords: cyanobacteria microbial carbonate precipitation
from_year: 2015
min_citations: 5
max_results: 15
sort_by: relevance
```


%% results-begin: Cyanobacteria MICP %%
*Fetched 2026-04-24 — showing 15 of ~2169 matching OpenAlex records.*

### 1. Chuo et al., 2020 — Insights into the Current Trends in the Utilization of Bacteria for Microbially Induced Calcium Carbonate Precipitation
*Materials* · 201 cites · FWCI 10.41 · 📖 OA · [DOI](https://doi.org/10.3390/ma13214993) · key: `chuo2020insights`

> Nowadays, microbially induced calcium carbonate precipitation (MICP) has received great attention for its potential in construction and geotechnical applications. This technique has been used in biocementation of sand, consolidation of soil, production of self-healing concrete or mortar, and removal of heavy metal ions from water. The products of MICP often have enhanced strength, durability, and self-healing ability. Utilization of the…

### 2. Suosaari et al., 2016 — New multi-scale perspectives on the stromatolites of Shark Bay, Western Australia
*Scientific Reports* · 175 cites · FWCI 52.18 · 📖 OA · [DOI](https://doi.org/10.1038/srep20557) · key: `suosaari2016new`

> A recent field-intensive program in Shark Bay, Western Australia provides new multi-scale perspectives on the world's most extensive modern stromatolite system. Mapping revealed a unique geographic distribution of morphologically distinct stromatolite structures, many of them previously undocumented. These distinctive structures combined with characteristic shelf physiography define eight 'Stromatolite Provinces'. Morphological and molecular studies of microbial mat composition resulted in a…

### 3. Gómez et al., 2018 — Calcium Carbonate Precipitation in Diatom-rich Microbial Mats: The Laguna Negra Hypersaline Lake, Catamarca, Argentina
*Journal of Sedimentary Research* · 67 cites · FWCI 4.31 · 📖 OA · [DOI](https://doi.org/10.2110/jsr.2018.37) · key: `gomez2018calcium`

> Carbonate microbialites provide a window to understand microbe-mineral interactions in modern environments and in the geological record. Unraveling microbial versus physicochemical controls and biogeochemical signatures is not always straightforward. Environmental and laboratory studies have shown that microbial activity can play a central role in calcium carbonate precipitation. Most studies have focused on the effects of Bacteria and Archaea activity on…

### 4. Saghaï et al., 2015 — Metagenome-based diversity analyses suggest a significant contribution of non-cyanobacterial lineages to carbonate precipitation in modern microbialites
*Frontiers in Microbiology* · 82 cites · FWCI 11.25 · 📖 OA · [DOI](https://doi.org/10.3389/fmicb.2015.00797) · key: `saghai2015metagenomebased`

> Cyanobacteria are thought to play a key role in carbonate formation due to their metabolic activity, but other organisms carrying out oxygenic photosynthesis (photosynthetic eukaryotes) or other metabolisms (e.g., anoxygenic photosynthesis, sulfate reduction), may also contribute to carbonate formation. To obtain more quantitative information than that provided by more classical PCR-dependent methods, we studied the microbial diversity of microbialites from…

### 5. McCutcheon et al., 2015 — Microbially Accelerated Carbonate Mineral Precipitation as a Strategy for in Situ Carbon Sequestration and Rehabilitation of Asbestos Mine Sites
*Environmental Science & Technology* · 67 cites · FWCI 2.80 · [DOI](https://doi.org/10.1021/acs.est.5b04293) · key: `mccutcheon2015microbially`

> A microbially accelerated process for the precipitation of carbonate minerals was implemented in a sample of serpentinite mine tailings collected from the abandoned Woodsreef Asbestos Mine in New South Wales, Australia as a strategy to sequester atmospheric CO2 while also stabilizing the tailings. Tailings were leached using sulfuric acid in reaction columns and subsequently inoculated with an alkalinity-generating cyanobacteria-dominated microbial…

### 6. Li et al., 2018 — Deterioration-Associated Microbiome of Stone Monuments: Structure, Variation, and Assembly
*Applied and Environmental Microbiology* · 101 cites · FWCI 11.03 · 📖 OA · [DOI](https://doi.org/10.1128/aem.02680-17) · key: `li2018deteriorationassociated`

> ABSTRACT Research on the microbial communities that colonize stone monuments may provide a new understanding of stone biodeterioration and microbe-induced carbonate precipitation. This work investigated the seasonal variation of microbial communities in 2016 and 2017, as well as its effects on stone monuments. We determined the bacterial and fungal compositions of 12 samples from four well-separated geographic locations by using…

### 7. Lindsay et al., 2016 — Microbialite response to an anthropogenic salinity gradient in Great Salt Lake, Utah
*Geobiology* · 80 cites · FWCI 6.80 · [DOI](https://doi.org/10.1111/gbi.12201) · key: `lindsay2016microbialite`

> A railroad causeway across Great Salt Lake, Utah (GSL), has restricted water flow since its construction in 1959, resulting in a more saline North Arm (NA; 24%-31% salinity) and a less saline South Arm (SA; 11%-14% salinity). Here, we characterized microbial carbonates collected from the SA and the NA to evaluate the effect of increased salinity on community composition and…

### 8. Farı́as et al., 2017 — Prokaryotic diversity and biogeochemical characteristics of benthic microbial ecosystems at La Brava, a hypersaline lake at Salar de Atacama, Chile
*PLoS ONE* · 58 cites · FWCI 3.79 · 📖 OA · [DOI](https://doi.org/10.1371/journal.pone.0186867) · key: `faras2017prokaryotic`

> Benthic microbial ecosystems of Laguna La Brava, Salar de Atacama, a high altitude hypersaline lake, were characterized in terms of bacterial and archaeal diversity, biogeochemistry, (including O2 and sulfide depth profiles and mineralogy), and physicochemical characteristics. La Brava is one of several lakes in the Salar de Atacama where microbial communities are growing in extreme conditions, including high salinity, high…

### 9. Catto et al., 2016 — The microbial nature of laminated limestones: Lessons from the Upper Aptian, Araripe Basin, Brazil
*Sedimentary Geology* · 101 cites · FWCI 14.72 · 📖 OA · [DOI](https://doi.org/10.1016/j.sedgeo.2016.05.007) · key: `catto2016microbial`

### 10. Yu et al., 2019 — Microbial metallogenesis of Cryogenian manganese ore deposits in South China
*Precambrian Research* · 84 cites · FWCI 6.73 · 📖 OA · [DOI](https://doi.org/10.1016/j.precamres.2019.01.004) · key: `yu2019microbial`

### 11. McCutcheon et al., 2017 — Experimental Deployment of Microbial Mineral Carbonation at an Asbestos Mine: Potential Applications to Carbon Storage and Tailings Stabilization
*Minerals* · 42 cites · FWCI 2.00 · 📖 OA · [DOI](https://doi.org/10.3390/min7100191) · key: `mccutcheon2017experimental`

> A microbial mineral carbonation trial was conducted at the Woodsreef Asbestos Mine (NSW, Australia) to test cyanobacteria-accelerated Mg-carbonate mineral precipitation in mine tailings. The experiment aimed to produce a carbonate crust on the tailings pile surface using atmospheric carbon dioxide and magnesium from serpentine minerals (asbestiform chrysotile; Mg3Si2O5(OH)4) and brucite [Mg(OH)2]. The crust would serve two purposes: Sequestering carbon and…

### 12. Zhu et al., 2015 — Potential application of biomineralization by Synechococcus PCC8806 for concrete restoration
*Ecological Engineering* · 87 cites · FWCI 3.26 · [DOI](https://doi.org/10.1016/j.ecoleng.2015.05.017) · key: `zhu2015potential`

### 13. Zhu et al., 2018 — Assessment of cyanobacterial species for carbonate precipitation on mortar surface under different conditions
*Ecological Engineering* · 38 cites · FWCI 1.47 · [DOI](https://doi.org/10.1016/j.ecoleng.2018.05.038) · key: `zhu2018assessment`

### 14. Mlewski et al., 2018 — Characterization of Pustular Mats and Related Rivularia-Rich Laminations in Oncoids From the Laguna Negra Lake (Argentina)
*Frontiers in Microbiology* · 47 cites · FWCI 6.93 · 📖 OA · [DOI](https://doi.org/10.3389/fmicb.2018.00996) · key: `mlewski2018characterization`

> Stromatolites are organo-sedimentary structures that represent some of the oldest records of the early biosphere on Earth. Cyanobacteria are considered as a main component of the microbial mats that are supposed to produce stromatolite-like structures. Understanding the role of cyanobacteria and associated microorganisms on the mineralization processes is critical to better understand what can be preserved in the laminated structure…

### 15. Warden et al., 2016 — Characterization of Microbial Mat Microbiomes in the Modern Thrombolite Ecosystem of Lake Clifton, Western Australia Using Shotgun Metagenomics
*Frontiers in Microbiology* · 43 cites · FWCI 4.65 · 📖 OA · [DOI](https://doi.org/10.3389/fmicb.2016.01064) · key: `warden2016characterization`

> Microbialite-forming communities interact with the environment and influence the precipitation of calcium carbonate through their metabolic activity. The functional genes associated with these metabolic processes and their environmental interactions are therefore critical to microbialite formation. The microbiomes associated with microbialite-forming ecosystems are just now being elucidated and the extent of shared pathways and taxa across different environments is not fully…
%% results-end: Cyanobacteria MICP %%
