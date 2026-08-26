// Void Editor - TranscriptAI
// Author: Aktug Antika

const path          = require('path');
const child_process = require('child_process');
const fs            = require('fs');
const os            = require('os');

var csInterface = new CSInterface();
var EXE_PATH    = "";

document.addEventListener('DOMContentLoaded', function() {
  var extPath = path.normalize(csInterface.getSystemPath(SystemPath.EXTENSION));
  var exeName = (window.navigator.platform.indexOf('Win') !== -1) ? 'VoidEditorTranscript.exe' : 'VoidEditorTranscript';
  EXE_PATH = path.join(extPath, 'dist', exeName);
  loadSavedSettings();
  initMenu();
  buildFontDropdown();
  initPreview();
});

// ─────────────────────────────────────────
// Font PostScript Map
// ─────────────────────────────────────────
function toPostScriptFont(displayName, bold, italic) {
  var map = {
    'Arial':               { n: 'ArialMT',                    b: 'Arial-BoldMT',                    i: 'Arial-ItalicMT',                    bi: 'Arial-BoldItalicMT' },
    'Roboto':              { n: 'Roboto-Regular',              b: 'Roboto-Bold',                     i: 'Roboto-Italic',                     bi: 'Roboto-BoldItalic' },
    'Inter':               { n: 'Inter-Regular',               b: 'Inter-Bold',                      i: 'Inter-Italic',                      bi: 'Inter-BoldItalic' },
    'Open Sans':           { n: 'OpenSans-Regular',            b: 'OpenSans-Bold',                   i: 'OpenSans-Italic',                   bi: 'OpenSans-BoldItalic' },
    'Nunito':              { n: 'Nunito-Regular',              b: 'Nunito-Bold',                     i: 'Nunito-Italic',                     bi: 'Nunito-BoldItalic' },
    'Playfair Display':    { n: 'PlayfairDisplay-Regular',     b: 'PlayfairDisplay-Bold',            i: 'PlayfairDisplay-Italic',            bi: 'PlayfairDisplay-BoldItalic' },
    'Cinzel':              { n: 'Cinzel-Regular',              b: 'Cinzel-Bold',                     i: 'Cinzel-Regular',                    bi: 'Cinzel-Bold' },
    'Cormorant Garamond':  { n: 'CormorantGaramond-Regular',  b: 'CormorantGaramond-Bold',          i: 'CormorantGaramond-Italic',          bi: 'CormorantGaramond-BoldItalic' },
    'Montserrat':          { n: 'Montserrat-Regular',          b: 'Montserrat-Bold',                 i: 'Montserrat-Italic',                 bi: 'Montserrat-BoldItalic' },
    'Lora':                { n: 'Lora-Regular',                b: 'Lora-Bold',                       i: 'Lora-Italic',                       bi: 'Lora-BoldItalic' },
    'UnifrakturMaguntia':  { n: 'UnifrakturMaguntia',          b: 'UnifrakturMaguntia',              i: 'UnifrakturMaguntia',                bi: 'UnifrakturMaguntia' },
    'Darker Grotesque':    { n: 'DarkerGrotesque-Regular',     b: 'DarkerGrotesque-Bold',            i: 'DarkerGrotesque-Regular',           bi: 'DarkerGrotesque-Bold' },
    'Pirata One':          { n: 'PirataOne-Regular',           b: 'PirataOne-Regular',               i: 'PirataOne-Regular',                 bi: 'PirataOne-Regular' },
    'Metal Mania':         { n: 'MetalMania-Regular',          b: 'MetalMania-Regular',              i: 'MetalMania-Regular',                bi: 'MetalMania-Regular' },
    'Bebas Neue':          { n: 'BebasNeue-Regular',           b: 'BebasNeue-Regular',               i: 'BebasNeue-Regular',                 bi: 'BebasNeue-Regular' },
    'Jost':                { n: 'Jost-Regular',                b: 'Jost-Bold',                       i: 'Jost-Italic',                       bi: 'Jost-BoldItalic' },
    'Archivo Black':       { n: 'ArchivoBlack-Regular',        b: 'ArchivoBlack-Regular',            i: 'ArchivoBlack-Regular',              bi: 'ArchivoBlack-Regular' },
    'Orbitron':            { n: 'Orbitron-Regular',            b: 'Orbitron-Bold',                   i: 'Orbitron-Regular',                  bi: 'Orbitron-Bold' },
    'Michroma':            { n: 'Michroma-Regular',            b: 'Michroma-Regular',                i: 'Michroma-Regular',                  bi: 'Michroma-Regular' },
    'Exo 2':               { n: 'Exo2-Regular',               b: 'Exo2-Bold',                       i: 'Exo2-Italic',                       bi: 'Exo2-BoldItalic' },
    'Rajdhani':            { n: 'Rajdhani-Regular',            b: 'Rajdhani-Bold',                   i: 'Rajdhani-Regular',                  bi: 'Rajdhani-Bold' },
    'Syncopate':           { n: 'Syncopate-Regular',           b: 'Syncopate-Bold',                  i: 'Syncopate-Regular',                 bi: 'Syncopate-Bold' },
    'EB Garamond':         { n: 'EBGaramond-Regular',          b: 'EBGaramond-Bold',                 i: 'EBGaramond-Italic',                 bi: 'EBGaramond-BoldItalic' },
    'Libre Baskerville':   { n: 'LibreBaskerville-Regular',    b: 'LibreBaskerville-Bold',           i: 'LibreBaskerville-Italic',           bi: 'LibreBaskerville-BoldItalic' },
    'Crimson Text':        { n: 'CrimsonText-Regular',         b: 'CrimsonText-Bold',                i: 'CrimsonText-Italic',                bi: 'CrimsonText-BoldItalic' },
    'Sorts Mill Goudy':    { n: 'SortsMillGoudy-Regular',      b: 'SortsMillGoudy-Regular',          i: 'SortsMillGoudy-Italic',             bi: 'SortsMillGoudy-Italic' },
    'Merriweather':        { n: 'Merriweather-Regular',        b: 'Merriweather-Bold',               i: 'Merriweather-Italic',               bi: 'Merriweather-BoldItalic' }
  };
  var entry = map[displayName];
  if (!entry) return displayName;
  if (bold && italic) return entry.bi;
  if (bold)           return entry.b;
  if (italic)         return entry.i;
  return entry.n;
}

// ─────────────────────────────────────────
// Start Transcription
// ─────────────────────────────────────────
function runTranscription() {
    var btn = document.getElementById('btn-transcribe');
    btn.disabled = true;
    setStatus('Checking sequence...', 'loading');
    showProgress(0);
    var startTime = Date.now();

  csInterface.evalScript('checkSequenceValid()', function(valid) {
    if (valid !== 'true') {
      setStatus('No active sequence found.', 'error');
      btn.disabled = false;
      return;
    }

    setStatus('Getting audio path...', 'loading');

    var audioTrackIdx = document.getElementById('audio-track').value;
    csInterface.evalScript('getActiveSequenceAudioPath(' + audioTrackIdx + ')', function(audioRaw) {
      var audioData;
      try { audioData = JSON.parse(audioRaw); } catch(e) {
        setStatus('Could not parse audio data.', 'error');
        btn.disabled = false;
        return;
      }

      if (audioData.error) {
        setStatus(audioData.error, 'error');
        btn.disabled = false;
        return;
      }

      var model    = document.getElementById('model-select').value;
      var language = document.getElementById('language-select').value;
      var maxChars = parseInt(document.getElementById('max-chars').value) || 42;
      var maxWords = parseInt(document.getElementById('max-words').value) || 7;

      var params = JSON.stringify({
        model:     model,
        language:  language || null,
        device:    'cpu',
        max_chars: maxChars,
        max_words: maxWords,
        clips:     audioData.clips || null
      });

      setStatus('Running transcription (' + model + ' model)...', 'loading');
      showProgress(10);

      runWhisperEngine('placeholder', params, function(err, output) {
        if (err) {
          setStatus('Engine error: ' + err, 'error');
          btn.disabled = false;
          return;
        }

        showProgress(80);

        var data;
        try { data = JSON.parse(output); } catch(e) {
          setStatus('Could not parse output.', 'error');
          btn.disabled = false;
          return;
        }

        if (data.error) {
          setStatus(data.error, 'error');
          btn.disabled = false;
          return;
        }

        showProgress(90);
        window._timelineOffset = (audioData.clips && audioData.clips.length > 0) ? audioData.clips[0].start : 0;
        applyTimelineOffset(data, audioData.clips);
		var rangeMode = document.getElementById('transcribe-range').value;
        if (rangeMode === 'inout') {
          csInterface.evalScript('getSequenceInOutPoints()', function(ioResult) {
            var filtered = false;
            try {
              var io = JSON.parse(ioResult);
              if (!io.error && io.outPoint > io.inPoint && io.inPoint >= 0) {
                data.lines = data.lines.filter(function(line) {
                  return line.end > io.inPoint && line.start < io.outPoint;
                });
                data.line_count = data.lines.length;
                filtered = true;
              }
            } catch(e) {}

            if (filtered && data.line_count === 0) {
              setStatus('No lines found in the selected range.', 'error');
              btn.disabled = false;
              return;
            }

            showResults(data);
            setStatus(data.line_count + ' lines transcribed. Language: ' + data.language.toUpperCase(), 'success');
            showProgress(100);
            btn.disabled = false;
          });
        } else {
          showResults(data);
          setStatus(data.line_count + ' lines transcribed. Language: ' + data.language.toUpperCase(), 'success');
          showProgress(100);
          btn.disabled = false;
        }
      });
    });
  });
}

// ─────────────────────────────────────────
// Run Whisper Engine
// ─────────────────────────────────────────
function runWhisperEngine(mediaPath, params, callback) {
  var exePath = path.normalize(EXE_PATH);
  var cwd     = path.dirname(exePath);

  var proc;
  try {
    proc = child_process.spawn(exePath, ['placeholder', params], { cwd: cwd });
  } catch(e) {
    callback('Could not start engine: ' + e.toString(), null);
    return;
  }

  var output = '';
  var errOut = '';

  proc.stdout.on('data', function(d) { output += d.toString(); });
  proc.stderr.on('data', function(d) { errOut += d.toString(); });

  proc.on('exit', function(code) {
    if (code === 0) callback(null, output);
    else callback('Code ' + code + ': ' + errOut.substring(0, 200), null);
  });
}


function applyTimelineOffset(data, clips) {
  if (!clips || clips.length === 0 || !data.lines) return;
  var offset = clips[0].start;
  if (!offset || offset === 0) return;
  data.lines.forEach(function(line) {
    line.start += offset;
    line.end += offset;
    if (line.words) {
      line.words.forEach(function(w) {
        w.start += offset;
        w.end += offset;
      });
    }
  });
}
// ─────────────────────────────────────────
// Show Results
// ─────────────────────────────────────────
function showResults(data) {
  var countEl   = document.getElementById('transcript-count');
  var container = document.getElementById('transcript-container');

  countEl.textContent = data.line_count;
  window._transcriptData = data;

  renderTranscriptList();

  container.classList.remove('hidden');
  document.getElementById('action-buttons-container').classList.remove('hidden');
  document.getElementById('btn-add-to-timeline').disabled = false;
}

function renderTranscriptList() {
  var list = document.getElementById('transcript-list');
  list.innerHTML = '';

  var lines = window._transcriptData.lines;

  lines.forEach(function(line, i) {
    var item = document.createElement('div');
    item.className = 'transcript-item';
    item.dataset.index = i;

    // Sol mini butonlar
    var leftActions = document.createElement('div');
    leftActions.className = 'transcript-left-actions';

    var addBtn = document.createElement('button');
    addBtn.className = 'transcript-micro-btn add';
    addBtn.textContent = '+';
    addBtn.title = 'Add line here';
    addBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      addLine(i);
    });
    leftActions.appendChild(addBtn);

    if (i < lines.length - 1) {
      var mergeBtn = document.createElement('button');
      mergeBtn.className = 'transcript-micro-btn merge';
      mergeBtn.textContent = '⤵';
      mergeBtn.title = 'Merge with next';
      mergeBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        mergeLine(i);
      });
      leftActions.appendChild(mergeBtn);
    }

    var timeEl = document.createElement('span');
    timeEl.className = 'transcript-time';
    timeEl.textContent = formatTime(line.start);
    timeEl.title = 'Click to edit timestamp';
    timeEl.style.cursor = 'pointer';
    timeEl.addEventListener('click', function(e) {
      e.stopPropagation();
      startTimeEdit(i, timeEl);
    });

    var textEl = document.createElement('span');
    textEl.className = 'transcript-text';
    textEl.textContent = line.text;
    textEl.style.cursor = 'text';
    textEl.addEventListener('click', function(e) {
      e.stopPropagation();
      startTextEdit(i, textEl);
    });

    var durEl = document.createElement('span');
    durEl.className = 'transcript-dur';
    durEl.textContent = (line.end - line.start).toFixed(1) + 's';

    var actionsEl = document.createElement('div');
    actionsEl.className = 'transcript-actions';

    var delBtn = document.createElement('button');
    delBtn.className = 'transcript-action-btn danger';
    delBtn.textContent = '✕';
    delBtn.title = 'Delete line';
    delBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      deleteLine(i);
    });

    actionsEl.appendChild(delBtn);
    item.appendChild(leftActions);
    item.appendChild(timeEl);
    item.appendChild(textEl);
    item.appendChild(durEl);
    item.appendChild(actionsEl);
    list.appendChild(item);
  });

  document.getElementById('transcript-count').textContent = lines.length;
}

function startTextEdit(index, el) {
  var line  = window._transcriptData.lines[index];
  var input = document.createElement('textarea');
  input.className = 'transcript-text-input';
  input.value = line.text;
  input.rows  = 1;
  input.style.height = 'auto';

  el.parentElement.classList.add('editing');
  el.replaceWith(input);
  input.focus();
  input.select();

  function commit() {
    var newText = input.value.trim();
    if (newText) window._transcriptData.lines[index].text = newText;
    renderTranscriptList();
  }

  input.addEventListener('blur', commit);
  input.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); commit(); }
    if (e.key === 'Escape') { renderTranscriptList(); }
  });
}

function startTimeEdit(index, el) {
  var line  = window._transcriptData.lines[index];
  var input = document.createElement('input');
  input.className = 'transcript-time-input';
  input.type  = 'text';
  input.value = formatTime(line.start);
  input.style.width = '44px';

  el.replaceWith(input);
  input.focus();
  input.select();

  function commit() {
    var parts = input.value.split(':');
    if (parts.length === 2) {
      var newStart = parseFloat(parts[0]) * 60 + parseFloat(parts[1]);
      if (!isNaN(newStart) && newStart >= 0) {
        window._transcriptData.lines[index].start = newStart;
      }
    }
    renderTranscriptList();
  }

  input.addEventListener('blur', commit);
  input.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') { e.preventDefault(); commit(); }
    if (e.key === 'Escape') { renderTranscriptList(); }
  });
}

function deleteLine(index) {
  window._transcriptData.lines.splice(index, 1);
  window._transcriptData.line_count = window._transcriptData.lines.length;
  renderTranscriptList();
}

function mergeLine(index) {
  var lines = window._transcriptData.lines;
  if (index >= lines.length - 1) return;
  lines[index].text = lines[index].text + ' ' + lines[index + 1].text;
  lines[index].end  = lines[index + 1].end;
  if (lines[index].words && lines[index + 1].words) {
    lines[index].words = lines[index].words.concat(lines[index + 1].words);
  }
  lines.splice(index + 1, 1);
  window._transcriptData.line_count = lines.length;
  renderTranscriptList();
}

function addLine(afterIndex) {
  var lines     = window._transcriptData.lines;
  var prevEnd   = afterIndex > 0 ? lines[afterIndex - 1].end : 0;
  var nextStart = afterIndex < lines.length ? lines[afterIndex].start : prevEnd + 2;
  var midpoint  = (prevEnd + nextStart) / 2;

  var newLine = {
    text:  'New line',
    start: parseFloat(prevEnd.toFixed(3)),
    end:   parseFloat(midpoint.toFixed(3)),
    words: []
  };

  lines.splice(afterIndex, 0, newLine);
  window._transcriptData.line_count = lines.length;
  renderTranscriptList();

  setTimeout(function() {
    var items = document.querySelectorAll('.transcript-item');
    if (items[afterIndex]) {
      var textEl = items[afterIndex].querySelector('.transcript-text');
      if (textEl) startTextEdit(afterIndex, textEl);
    }
  }, 50);
}

function makeMergeZone(index) {
  var zone = document.createElement('div');
  zone.className = 'transcript-merge-zone';
  zone.title = 'Merge with next line';
  zone.innerHTML = '<div class="merge-line"></div><span class="merge-label">merge</span><div class="merge-line"></div>';
  zone.addEventListener('click', function() { mergeLine(index); });
  return zone;
}

function makeAddZone(afterIndex) {
  var zone = document.createElement('div');
  zone.className = 'transcript-add-zone';
  zone.title = 'Add new line here';
  zone.innerHTML = '<div class="add-icon">+</div><span class="add-label">add line</span>';
  zone.addEventListener('click', function() { addLine(afterIndex); });
  return zone;
}

// ─────────────────────────────────────────
// Style Panel Helpers
// ─────────────────────────────────────────
function toggleStyleBtn(id) {
  var btn = document.getElementById(id);
  btn.classList.toggle('active');
  saveSettings();
}

// ─────────────────────────────────────────
// Custom Font Dropdown
// ─────────────────────────────────────────
var FONT_LIST = [
  { category: 'Normal', fonts: [
    { name: 'Arial', family: 'Arial' },
    { name: 'Roboto', family: 'Roboto' },
    { name: 'Inter', family: 'Inter' },
    { name: 'Open Sans', family: "'Open Sans'" },
    { name: 'Nunito', family: 'Nunito' }
  ]},
  { category: 'Elegant', fonts: [
    { name: 'Playfair Display', family: "'Playfair Display'" },
    { name: 'Cinzel', family: 'Cinzel' },
    { name: 'Cormorant Garamond', family: "'Cormorant Garamond'" },
    { name: 'Montserrat', family: 'Montserrat' },
    { name: 'Lora', family: 'Lora' }
  ]},
  { category: 'Gothic', fonts: [
    { name: 'UnifrakturMaguntia', family: 'UnifrakturMaguntia' },
    { name: 'Darker Grotesque', family: "'Darker Grotesque'" },
    { name: 'Pirata One', family: "'Pirata One'" },
    { name: 'Metal Mania', family: "'Metal Mania'" }
  ]},
  { category: 'Modern', fonts: [
    { name: 'Bebas Neue', family: "'Bebas Neue'" },
    { name: 'Jost', family: 'Jost' },
    { name: 'Archivo Black', family: "'Archivo Black'" },
    { name: 'Orbitron', family: 'Orbitron' }
  ]},
  { category: 'Sci-Fi', fonts: [
    { name: 'Michroma', family: 'Michroma' },
    { name: 'Exo 2', family: "'Exo 2'" },
    { name: 'Rajdhani', family: 'Rajdhani' },
    { name: 'Syncopate', family: 'Syncopate' }
  ]},
  { category: 'Literature', fonts: [
    { name: 'EB Garamond', family: "'EB Garamond'" },
    { name: 'Libre Baskerville', family: "'Libre Baskerville'" },
    { name: 'Crimson Text', family: "'Crimson Text'" },
    { name: 'Sorts Mill Goudy', family: "'Sorts Mill Goudy'" },
    { name: 'Merriweather', family: 'Merriweather' }
  ]}
];

function buildFontDropdown() {
  var list = document.getElementById('font-dropdown-list');
  list.innerHTML = '';

  FONT_LIST.forEach(function(group, gi) {
    if (gi > 0) {
      var divider = document.createElement('div');
      divider.className = 'font-dropdown-divider';
      list.appendChild(divider);
    }

    var cat = document.createElement('div');
    cat.className = 'font-dropdown-category';
    cat.textContent = group.category;
    list.appendChild(cat);

    group.fonts.forEach(function(font) {
      var item = document.createElement('div');
      item.className = 'font-dropdown-item';
      item.textContent = font.name;
      item.style.fontFamily = font.family;
      item.dataset.value = font.name;
      item.addEventListener('click', function() {
        selectFont(font.name, font.family);
      });
      list.appendChild(item);
    });
  });
}

function selectFont(name, family) {
  var label = document.getElementById('font-dropdown-label');
  var hidden = document.getElementById('font-family');
  var list = document.getElementById('font-dropdown-list');
  var selected = document.getElementById('font-dropdown-selected');

  label.textContent = name;
  label.style.fontFamily = family;
  hidden.value = name;

  var items = list.querySelectorAll('.font-dropdown-item');
  items.forEach(function(item) {
    item.classList.toggle('selected', item.dataset.value === name);
  });

  list.classList.remove('open');
  selected.classList.remove('open');
  saveSettings();
}

function toggleFontDropdown() {
  var list = document.getElementById('font-dropdown-list');
  var selected = document.getElementById('font-dropdown-selected');
  var isOpen = list.classList.contains('open');

  list.classList.toggle('open', !isOpen);
  selected.classList.toggle('open', !isOpen);
}

document.addEventListener('click', function(e) {
  var wrapper = document.getElementById('font-dropdown-wrapper');
  if (wrapper && !wrapper.contains(e.target)) {
    document.getElementById('font-dropdown-list').classList.remove('open');
    document.getElementById('font-dropdown-selected').classList.remove('open');
  }
});

function updateSizeLabel(val) {
  document.getElementById('font-size-label').textContent = val;
}

function getStyleSettings() {
  var boldActive   = document.getElementById('btn-bold').classList.contains('active');
  var italicActive = document.getElementById('btn-italic').classList.contains('active');
  return {
    fontFamily:       document.getElementById('font-family').value,
    fontSize:         parseInt(document.getElementById('font-size').value) || 60,
    bold:             boldActive,
    italic:           italicActive,
    textColor:        document.getElementById('text-color').value,
    highlightEnabled: document.getElementById('highlight-enabled').checked,
    highlightColor:   document.getElementById('highlight-color').value,
    outlineEnabled:   document.getElementById('outline-enabled').checked,
    outlineColor:     document.getElementById('outline-color').value,
    outlineWidth:     parseInt(document.getElementById('outline-width').value) || 3,
    shadowEnabled:    document.getElementById('shadow-enabled').checked,
    shadowColor:      document.getElementById('shadow-color').value,
    shadowOpacity:    parseInt(document.getElementById('shadow-opacity').value) || 75,
    shadowDistance:    parseInt(document.getElementById('shadow-distance').value) || 5,
    shadowSoftness:   parseInt(document.getElementById('shadow-softness').value) || 5,
    bgEnabled:        document.getElementById('bg-enabled').checked,
    bgColor:          document.getElementById('bg-color').value,
    bgOpacity:        parseInt(document.getElementById('bg-opacity').value) || 50,
    textAnim:         parseInt(document.getElementById('text-anim').value) || 0,
    hlAnim:           parseInt(document.getElementById('hl-anim').value) || 0
  };
}

// ─────────────────────────────────────────
// Add to Timeline
// ─────────────────────────────────────────
function addToTimeline() {
  if (!window._transcriptData) {
    setStatus('Run transcription first.', 'error');
    return;
  }

  var btn        = document.getElementById('btn-add-to-timeline');
  var trackIndex = parseInt(document.getElementById('track-index').value) || 1;
  var style      = getStyleSettings();

  btn.disabled = true;
  setStatus('Adding to timeline...', 'loading');

  if (style.highlightEnabled) {
    addMOGRTCaption(trackIndex, style, btn);
  } else {
    addWithCaption(trackIndex, btn);
  }
}

function addWithCaption(trackIndex, btn) {
  var srt = '';
  window._transcriptData.lines.forEach(function(line, i) {
    srt += (i + 1) + '\n';
    srt += fmtSRT(line.start) + ' --> ' + fmtSRT(line.end) + '\n';
    srt += line.text + '\n\n';
  });

  var srtPath  = path.join(os.tmpdir(), 'transcriptai_' + Date.now() + '.srt');
  fs.writeFileSync(srtPath, srt, 'utf8');

  var safePath = srtPath.replace(/\\/g, '/');
  var script   = 'addSubtitleClipsLegacy("' + safePath + '", ' + trackIndex + ')';

  csInterface.evalScript(script, function(result) {
    var r;
    try { r = JSON.parse(result); } catch(e) {
      setStatus('Error: ' + result, 'error');
      btn.disabled = false;
      return;
    }
    if (r.error) setStatus(r.error, 'error');
    else setStatus('Captions added to timeline.', 'success');
    btn.disabled = false;
  });
}

function addMOGRTCaption(trackIndex, style, btn) {
  var maxLines = parseInt(document.getElementById('max-lines').value) || 1;
  var transcriptLines = window._transcriptData.lines;
  if (maxLines > 1) {
    transcriptLines = [];
    for (var i = 0; i < window._transcriptData.lines.length; i++) {
      var orig = window._transcriptData.lines[i];
      var newLine = { text: splitTextToLines(orig.text, maxLines), start: orig.start, end: orig.end, words: orig.words };
      transcriptLines.push(newLine);
    }
  }
  var payload = {
    lines:          maxLines > 1 ? transcriptLines : window._transcriptData.lines,
    timelineOffset: window._timelineOffset || 0,
    trackIndex:     trackIndex,
    fontFamily:     toPostScriptFont(style.fontFamily, style.bold, style.italic),
    fontSize:       style.fontSize,
    bold:           style.bold,
    italic:         style.italic,
    textColor:      [
      parseInt(style.textColor.slice(1,3), 16),
      parseInt(style.textColor.slice(3,5), 16),
      parseInt(style.textColor.slice(5,7), 16)
    ],
    highlightColor: [
      parseInt(style.highlightColor.slice(1,3), 16),
      parseInt(style.highlightColor.slice(3,5), 16),
      parseInt(style.highlightColor.slice(5,7), 16)
    ],
    outlineEnabled: style.outlineEnabled,
    outlineColor:   [
      parseInt(style.outlineColor.slice(1,3), 16),
      parseInt(style.outlineColor.slice(3,5), 16),
      parseInt(style.outlineColor.slice(5,7), 16)
    ],
    outlineWidth:   style.outlineWidth,
    shadowEnabled:  style.shadowEnabled,
    shadowColor:    [
      parseInt(style.shadowColor.slice(1,3), 16),
      parseInt(style.shadowColor.slice(3,5), 16),
      parseInt(style.shadowColor.slice(5,7), 16)
    ],
    shadowOpacity:  style.shadowOpacity,
    shadowDistance:  style.shadowDistance,
    shadowSoftness: style.shadowSoftness,
    bgEnabled:      style.bgEnabled,
    bgColor:        [
      parseInt(style.bgColor.slice(1,3), 16),
      parseInt(style.bgColor.slice(3,5), 16),
      parseInt(style.bgColor.slice(5,7), 16)
    ],
    bgOpacity:      style.bgOpacity,
    textAnim:       style.textAnim,
    hlAnim:         style.hlAnim
  };

  var jsonPath = path.join(os.tmpdir(), 'transcriptai_mogrt_' + Date.now() + '.json');
  fs.writeFileSync(jsonPath, JSON.stringify(payload), 'utf8');

  var extPath   = path.normalize(csInterface.getSystemPath(SystemPath.EXTENSION));
  var mogrtPath = path.join(extPath, 'dist', 'source', 'dinamik_altyazi_motoru.mogrt');
  var safeMogrt = mogrtPath.replace(/\\/g, '/');
  var safeJson  = jsonPath.replace(/\\/g, '/');
  var script    = 'addMOGRTCaption("' + safeMogrt + '", "' + safeJson + '")';

  csInterface.evalScript(script, function(result) {
    var r;
    try { r = JSON.parse(result); } catch(e) {
      setStatus('Error: ' + result, 'error');
      btn.disabled = false;
      return;
    }

    if (r.error) {
      setStatus(r.error, 'error');
    } else {
      var trimOk = (r.trim === 'trimmed');
      setStatus('Caption added: ' + r.total + ' lines, ' + r.words + ' words. ' + (trimOk ? '✓ Trimmed' : '⚠ Trim: ' + r.trim), trimOk ? 'success' : 'success');
    }
    btn.disabled = false;
  });
}

// ─────────────────────────────────────────
// SRT Export
// ─────────────────────────────────────────
function exportSRT() {
  if (!window._transcriptData) {
    setStatus('Run transcription first.', 'error');
    return;
  }

  var srt = '';
  window._transcriptData.lines.forEach(function(line, i) {
    srt += (i + 1) + '\n';
    srt += fmtSRT(line.start) + ' --> ' + fmtSRT(line.end) + '\n';
    srt += line.text + '\n\n';
  });

  var savePath = path.join(os.tmpdir(), 'transcript_' + Date.now() + '.srt');
  fs.writeFileSync(savePath, srt, 'utf8');
  setStatus('SRT saved: ' + savePath, 'success');

  var opener = (process.platform === 'darwin') ? 'open' : 'explorer';
  child_process.spawn(opener, [path.dirname(savePath)], { detached: true });
}

function browseTemplate() {
  alert('Please type the .mogrt file path manually.');
}

// ─────────────────────────────────────────
// UI Helpers
// ─────────────────────────────────────────
function setStatus(msg, type) {
  var el = document.getElementById('status-bar');
  if (!el) return;
  el.textContent = msg;
  el.className   = 'status-bar ' + type;
  el.classList.remove('hidden');
}

function showProgress(pct) {
  var bar = document.getElementById('progress-bar');
  var con = document.getElementById('progress-container');
  if (!bar || !con) return;
  if (pct === 0) con.classList.remove('hidden');
  else if (pct >= 100) setTimeout(function() { con.classList.add('hidden'); }, 1500);
  bar.style.width = pct + '%';
}

function formatTime(s) {
  var m   = Math.floor(s / 60);
  var sec = (s % 60).toFixed(1);
  if (parseFloat(sec) < 10) sec = '0' + sec;
  return m + ':' + sec;
}

function fmtSRT(s) {
  var h  = Math.floor(s / 3600);
  var m  = Math.floor((s % 3600) / 60);
  var sc = Math.floor(s % 60);
  var ms = Math.round((s % 1) * 1000);
  return pad(h) + ':' + pad(m) + ':' + pad(sc) + ',' + pad(ms, 3);
}

function pad(n, len) {
  return String(n).padStart(len || 2, '0');
}

function escHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function loadSavedSettings() {
  ['model-select','language-select','max-chars','max-words','max-lines','transcribe-range','audio-track','track-index',
   'highlight-color','text-color','font-family','font-size',
   'outline-color','outline-width','shadow-color','shadow-opacity','shadow-distance','shadow-softness',
   'bg-color','bg-opacity','text-anim','hl-anim'].forEach(function(id) {
    var saved = localStorage.getItem('tai_' + id);
    var el    = document.getElementById(id);
    if (saved && el) el.value = saved;
  });

  var hlEl = document.getElementById('highlight-enabled');
  var hlSaved = localStorage.getItem('tai_highlight-enabled');
  if (hlEl && hlSaved) hlEl.checked = hlSaved === 'true';

  var boldEl = document.getElementById('btn-bold');
  if (boldEl && localStorage.getItem('tai_bold') === 'true') boldEl.classList.add('active');

  var italicEl = document.getElementById('btn-italic');
  if (italicEl && localStorage.getItem('tai_italic') === 'true') italicEl.classList.add('active');

  var sizeEl = document.getElementById('font-size');
  if (sizeEl) updateSizeLabel(sizeEl.value);
  
  var outlineEl = document.getElementById('outline-enabled');
  var outlineSaved = localStorage.getItem('tai_outline-enabled');
  if (outlineEl && outlineSaved) outlineEl.checked = outlineSaved === 'true';

  var shadowEl = document.getElementById('shadow-enabled');
  var shadowSaved = localStorage.getItem('tai_shadow-enabled');
  if (shadowEl && shadowSaved) shadowEl.checked = shadowSaved === 'true';

  var bgEl = document.getElementById('bg-enabled');
  var bgSaved = localStorage.getItem('tai_bg-enabled');
  if (bgEl && bgSaved) bgEl.checked = bgSaved === 'true';
  
  var savedFont = localStorage.getItem('tai_font-family');
  if (savedFont) {
    var fontFamily = savedFont;
    var family = fontFamily;
    FONT_LIST.forEach(function(group) {
      group.fonts.forEach(function(f) {
        if (f.name === fontFamily) family = f.family;
      });
    });
    selectFont(fontFamily, family);
  }
}

function saveSettings() {
  ['model-select','language-select','max-chars','max-words','max-lines','transcribe-range','audio-track','track-index',
   'highlight-color','text-color','font-family','font-size',
   'outline-color','outline-width','shadow-color','shadow-opacity','shadow-distance','shadow-softness',
   'bg-color','bg-opacity','text-anim','hl-anim'].forEach(function(id) {
    var el = document.getElementById(id);
    if (el) localStorage.setItem('tai_' + id, el.value);
  });

  var hlEl = document.getElementById('highlight-enabled');
  if (hlEl) localStorage.setItem('tai_highlight-enabled', hlEl.checked);

  var boldEl = document.getElementById('btn-bold');
  if (boldEl) localStorage.setItem('tai_bold', boldEl.classList.contains('active'));

  var italicEl = document.getElementById('btn-italic');
  if (italicEl) localStorage.setItem('tai_italic', italicEl.classList.contains('active'));
  
  var outlineEl = document.getElementById('outline-enabled');
  if (outlineEl) localStorage.setItem('tai_outline-enabled', outlineEl.checked);

  var shadowEl = document.getElementById('shadow-enabled');
  if (shadowEl) localStorage.setItem('tai_shadow-enabled', shadowEl.checked);

  var bgEl = document.getElementById('bg-enabled');
  if (bgEl) localStorage.setItem('tai_bg-enabled', bgEl.checked);
  
  localStorage.setItem('tai_caption-pos-x', _captionPos.x);
  localStorage.setItem('tai_caption-pos-y', _captionPos.y);
  updatePreviewStyle();
}

function initMenu() {
  document.querySelectorAll('.menu-item').forEach(function(item) {
    var label = item.querySelector('.menu-label');
    if (!label) return;
    label.addEventListener('click', function(e) {
      e.stopPropagation();
      var dd     = item.querySelector('.menu-dropdown');
      var isOpen = dd.style.display === 'block';
      document.querySelectorAll('.menu-dropdown').forEach(function(d) { d.style.display = 'none'; });
      dd.style.display = isOpen ? 'none' : 'block';
    });
  });

  document.addEventListener('click', function() {
    document.querySelectorAll('.menu-dropdown').forEach(function(d) { d.style.display = 'none'; });
  });

  document.querySelectorAll('.menu-dropdown').forEach(function(d) {
    d.addEventListener('click', function(e) { e.stopPropagation(); });
  });
}

function splitTextToLines(text, maxLines) {
  if (maxLines <= 1) return text;
  var words = text.split(' ');
  if (words.length <= 1) return text;
  var perLine = Math.ceil(words.length / maxLines);
  var lines = [];
  for (var i = 0; i < words.length; i += perLine) {
    lines.push(words.slice(i, i + perLine).join(' '));
  }
  return lines.join('\n');
}

// ─────────────────────────────────────────
// Caption Preview & Positioning
// ─────────────────────────────────────────
var _captionPos = { x: 50, y: 85 };

function initPreview() {
  var screen = document.getElementById('preview-screen');
  if (!screen) return;

  var posLabel = document.createElement('div');
  posLabel.className = 'preview-pos-label';
  posLabel.id = 'preview-pos-label';
  posLabel.textContent = 'X:50% Y:85%';
  screen.appendChild(posLabel);

  var crossH = document.createElement('div');
  crossH.className = 'preview-crosshair-h';
  crossH.id = 'preview-crosshair-h';
  screen.appendChild(crossH);

  var crossV = document.createElement('div');
  crossV.className = 'preview-crosshair-v';
  crossV.id = 'preview-crosshair-v';
  screen.appendChild(crossV);

  screen.addEventListener('mousedown', function(e) {
    setCaptionPos(e);
    var onMove = function(e2) { setCaptionPos(e2); };
    var onUp = function() {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      saveSettings();
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  });

  var savedX = localStorage.getItem('tai_caption-pos-x');
  var savedY = localStorage.getItem('tai_caption-pos-y');
  if (savedX && savedY) {
    _captionPos.x = parseFloat(savedX);
    _captionPos.y = parseFloat(savedY);
  }
  updatePreviewPosition();
  updatePreviewStyle();
}

function setCaptionPos(e) {
  var screen = document.getElementById('preview-screen');
  var rect = screen.getBoundingClientRect();
  var x = ((e.clientX - rect.left) / rect.width) * 100;
  var y = ((e.clientY - rect.top) / rect.height) * 100;
  _captionPos.x = Math.max(5, Math.min(95, Math.round(x)));
  _captionPos.y = Math.max(5, Math.min(95, Math.round(y)));
  updatePreviewPosition();
}

function updatePreviewPosition() {
  var caption = document.getElementById('preview-caption');
  var crossH = document.getElementById('preview-crosshair-h');
  var crossV = document.getElementById('preview-crosshair-v');
  var label = document.getElementById('preview-pos-label');
  if (caption) {
    caption.style.left = _captionPos.x + '%';
    caption.style.top = _captionPos.y + '%';
  }
  if (crossH) crossH.style.top = _captionPos.y + '%';
  if (crossV) crossV.style.left = _captionPos.x + '%';
  if (label) label.textContent = 'X:' + _captionPos.x + '% Y:' + _captionPos.y + '%';
}

function updatePreviewStyle() {
  var caption = document.getElementById('preview-caption');
  if (!caption) return;
  var style = getStyleSettings();
  var fontFamily = style.fontFamily;
  FONT_LIST.forEach(function(group) {
    group.fonts.forEach(function(f) {
      if (f.name === fontFamily) fontFamily = f.family;
    });
  });
  caption.style.fontFamily = fontFamily;
  caption.style.fontSize = Math.max(8, Math.min(18, style.fontSize / 5)) + 'px';
  caption.style.color = style.textColor;
  caption.style.fontWeight = style.bold ? 'bold' : 'normal';
  caption.style.fontStyle = style.italic ? 'italic' : 'normal';
  if (style.outlineEnabled) {
    caption.style.webkitTextStroke = '1px ' + style.outlineColor;
  } else {
    caption.style.webkitTextStroke = 'none';
  }
  if (style.bgEnabled) {
    caption.style.backgroundColor = style.bgColor;
    caption.style.opacity = style.bgOpacity / 100;
  } else {
    caption.style.backgroundColor = 'transparent';
    caption.style.opacity = 1;
  }
  if (style.shadowEnabled) {
    caption.style.textShadow = '2px 2px 4px ' + style.shadowColor;
  } else {
    caption.style.textShadow = '1px 1px 2px rgba(0,0,0,0.8)';
  }
}

function parseSRT(srtText) {
    var lines = [];
    var re = /(\d+)\s+(\d{2}):(\d{2}):(\d{2}),(\d{3})\s-->\s(\d{2}):(\d{2}):(\d{2}),(\d{3})\s+([\s\S]*?)(?=\n{2,}|\n*$)/g;
    var match;
    while ((match = re.exec(srtText)) !== null) {
        var start =
            parseInt(match[2], 10) * 3600 +
            parseInt(match[3], 10) * 60 +
            parseInt(match[4], 10) +
            parseInt(match[5], 10) / 1000;
        var end =
            parseInt(match[6], 10) * 3600 +
            parseInt(match[7], 10) * 60 +
            parseInt(match[8], 10) +
            parseInt(match[9], 10) / 1000;
        var text = match[10].replace(/\r?\n/g, ' ').trim();
        lines.push({
            text: text,
            start: start,
            end: end,
            words: []
        });
    }
    return lines;
}

function onImportSRTFile(event) {
    var file = event.target.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function(e) {
        var srtText = e.target.result;
        var parsed = parseSRT(srtText);

        // SRT'yi transcript veri yapısına yükle
        window._transcriptData = {
            lines: parsed,
            line_count: parsed.length,
            language: 'srt'
        };

        // Satır listesini göster
        if (typeof renderTranscriptList === 'function') {
            renderTranscriptList();
        }

        // Diğer UI kontrollerini güncelle
        var counter = document.getElementById('transcript-count');
        if (counter) counter.textContent = parsed.length;

        var container = document.getElementById('transcript-container');
        if (container) container.classList.remove('hidden');

        var actions = document.getElementById('action-buttons-container');
        if (actions) actions.classList.remove('hidden');

        var addBtn = document.getElementById('btn-add-to-timeline');
        if (addBtn) addBtn.disabled = false;

        // Durum mesajı (scriptinde varsa)
        if (typeof setStatus === 'function') {
            setStatus('SRT imported successfully.', 'success');
        }
    };
    reader.readAsText(file, 'utf-8');
}