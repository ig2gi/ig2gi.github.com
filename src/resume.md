---
title: Resume
toc: true
---

<div class="page-full">
  <div class="page-full-watermark">RESUME</div>
  <div class="page-full-label">[SCROLL TO EXPLORE]</div>
</div>

```js
import { buildResume } from "./components/resume.js"
```

```js
const resumeData = FileAttachment("./data/resume2.json").json()
```

<div class="profile-sections">
  ${buildResume(resumeData)}
</div>
