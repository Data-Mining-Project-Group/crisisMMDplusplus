# CrisisMMD++: Auditing and LLM-Assisted Re-Annotation of Multimodal Crisis Data

Code and derived annotations for the paper

> Y. Nawaz, K. Tangen, and A. Adesokan, "CrisisMMD++: Auditing and LLM-Assisted Re-Annotation of Multimodal Crisis Data," *2026 IEEE International Conference on Big Data (IEEE BigData)*, 12th Special Session on Intelligent Data Mining, Phoenix, AZ, USA, 2026.

CrisisMMD++ audits CrisisMMD v2.0 (18,082 image–tweet pairs from seven disasters), generates candidate re-annotations with GPT-4o-mini, and evaluates how changing the annotation source affects downstream multimodal classification. The main finding is that increased annotation coverage does not necessarily improve annotation quality or downstream utility.

## Repository structure

| Path | Contents |
|---|---|
| `Phase1_Data_Preprocessing_and_Leakage_Analysis.ipynb` | Phase 1: dataset audit (label completeness, class balance, MD5 / pHash redundancy, cross-partition overlap) |
| `Phase2_LLM_Annotation_CrisisMMD_PlusPlus.ipynb` | Phase 2: GPT-4o-mini multimodal candidate re-annotation |
| `Phase3_Dataset_Testing.ipynb` | Phase 3: controlled downstream comparison (human vs. LLM supervision, Configurations A–D) |
| `Phase4_Reviewer_Experiments.ipynb` | Additional protocols: repeated seeds, majority baselines, duplicate-aware splits, balanced subsets, matched records, class-distribution matching, coverage expansion |
| `CrisisMMD_PlusPlus_Final_Labels.csv` | Released annotation table: original human labels plus LLM candidate labels, image–text relationship, evidence and quality metadata |
| `annotations++/` | The same annotations split by disaster event |
| `CrisisMMD_v2_Annotations/` | Original annotations aligned with the LLM labels (used by Phase 3) |
| `thesis_analysis_results/` | Result tables and figures from Phases 2–4 |
| `CrisisMMD_Survey/` | Blind A/B human verification survey (web page, Google Apps Script backend, build script) |

## Setup

1. **Data.** Download CrisisMMD v2.0 from the [CrisisNLP website](https://crisisnlp.qcri.org/crisismmd) and extract it so the images are at `CrisisMMD_v2.0/data_image/...`. The original images are not included in this repository.
2. **Environment.** Python 3.9+ with `pandas`, `numpy`, `scikit-learn`, `torch`, `torchvision`, `transformers`, `pillow`, `imagehash`, `matplotlib`, and `openai` (Phase 2 only).
3. **API key (Phase 2 only).** Create a file `apikey.env` in the project root containing your own OpenAI key. This file is ignored by git and must never be committed.
4. Run the notebooks in order (Phase 1 → 4). Phase 4 caches text and image features in `cache/` and saves results after every run, so it can be resumed after an interruption.

## Data and license notes

The derived annotations are released subject to the original CrisisMMD terms of use. Please cite the original dataset:

> F. Alam, F. Ofli, and M. Imran, "CrisisMMD: Multimodal Twitter datasets from natural disasters," *Proc. ICWSM*, vol. 12, no. 1, 2018.

LLM-generated labels are candidate annotations, not verified ground truth.

## Citation

```bibtex
@inproceedings{nawaz2026crisismmdpp,
  title     = {CrisisMMD++: Auditing and LLM-Assisted Re-Annotation of Multimodal Crisis Data},
  author    = {Nawaz, Yasir and Tangen, Kaleb and Adesokan, Ademola},
  booktitle = {Proceedings of the 2026 IEEE International Conference on Big Data (BigData)},
  year      = {2026}
}
```
