// Void Editor - TranscriptAI
// Author: Aktug Antika

function checkSequenceValid() {
    try {
        var seq = app.project.activeSequence;
        if (!seq) return "false";
        return "true";
    } catch(e) {
        return "false";
    }
}

function getActiveSequenceAudioPath(trackIdx) {
    try {
        var seq = app.project.activeSequence;
        if (!seq) return '{"error":"No active sequence"}';
        var idx = parseInt(trackIdx) || 0;
        if (idx >= seq.audioTracks.numTracks) return '{"error":"Audio track A' + (idx + 1) + ' does not exist"}';
        var audioTrack = seq.audioTracks[idx];
        if (!audioTrack || audioTrack.clips.numItems === 0) return '{"error":"No clip on A' + (idx + 1) + ' track"}';
        var result = '{"clips":[';
        var first = true;
        for (var i = 0; i < audioTrack.clips.length; i++) {
            var clip = audioTrack.clips[i];
            if (clip.mediaType !== "Audio") continue;
            var mp = clip.projectItem.getMediaPath().replace(/\\/g, '/');
            if (!first) result += ',';
            first = false;
            result += '{"mediaPath":"' + mp + '","in":' + clip.inPoint.seconds + ',"out":' + clip.outPoint.seconds + ',"start":' + clip.start.seconds + '}';
        }
        result += ']}';
        return result;
    } catch(e) {
        return '{"error":"' + e.toString().replace(/"/g, '') + '"}';
    }
}

function addSubtitleClipsLegacy(srtPath, trackIndex) {
    try {
        var seq = app.project.activeSequence;
        if (!seq) return '{"error":"No active sequence"}';

        app.project.importFiles([srtPath], true, app.project.rootItem, false);

        var srtName = srtPath.split('/').pop();
        var srtItem = null;
        for (var k = 0; k < app.project.rootItem.children.numItems; k++) {
            var item = app.project.rootItem.children[k];
            if (item.name === srtName) {
                srtItem = item;
                break;
            }
        }

        if (!srtItem) return '{"error":"SRT imported but not found in project panel"}';

        if (seq.captionTracks && seq.captionTracks.numTracks > 0) {
            seq.captionTracks[0].insertClip(srtItem, seq.zeroPoint);
            return '{"success":true,"added":1,"total":1,"method":"insertCaption"}';
        } else {
            seq.createCaptionTrack(srtItem, seq.zeroPoint);
            return '{"success":true,"added":1,"total":1,"method":"captionTrack"}';
        }

    } catch(e) {
        try {
            var seq2 = app.project.activeSequence;
            seq2.importMGT(srtPath, 0, 0, 0);
            return '{"success":true,"added":1,"total":1,"method":"importMGT"}';
        } catch(e2) {
            return '{"error":"' + e.toString().replace(/"/g, "'") + ' | ' + e2.toString().replace(/"/g, "'") + '"}';
        }
    }
}

// ─── Saniyeyi timecode'a çevir (HH:MM:SS:FF) ───
function secondsToTimecode(secs, sequence) {
    var frameRate = sequence.getSettings().videoFrameRate.seconds;
    var fps = Math.round(1 / frameRate);
    var totalFrames = Math.round(secs / frameRate);
    var ff = totalFrames % fps;
    var ss = Math.floor(totalFrames / fps) % 60;
    var mm = Math.floor(totalFrames / (fps * 60)) % 60;
    var hh = Math.floor(totalFrames / (fps * 3600));
    return (hh < 10 ? "0" + hh : hh) + ":" +
           (mm < 10 ? "0" + mm : mm) + ":" +
           (ss < 10 ? "0" + ss : ss) + ":" +
           (ff < 10 ? "0" + ff : ff);
}

function getSequenceInOutPoints() {
    try {
        var seq = app.project.activeSequence;
        if (!seq) return '{"error":"No active sequence"}';
        var inTime = seq.getInPointAsTime();
        var outTime = seq.getOutPointAsTime();
        var inSec = inTime.seconds;
        var outSec = outTime.seconds;
        return '{"inPoint":' + inSec + ',"outPoint":' + outSec + '}';
    } catch(e) {
        return '{"error":"' + e.toString().replace(/"/g, '') + '"}';
    }
}

function addMOGRTCaption(mogrtPath, jsonPath) {
    try {
        var seq = app.project.activeSequence;
        if (!seq) return '{"error":"Aktif sekans bulunamadi"}';

        var mogrtFile = new File(mogrtPath);
        if (!mogrtFile.exists) return '{"error":"MOGRT bulunamadi: ' + mogrtPath + '"}';

        var f = new File(jsonPath);
        f.open("r");
        f.encoding = "UTF-8";
        var raw = f.read();
        f.close();

        var payload;
        try { payload = JSON.parse(raw); } catch(pe) {
            return '{"error":"JSON parse failed: ' + pe.toString().replace(/"/g, "'") + '"}';
        }

        var lines          = payload.lines          || [];
        var trackIndex     = parseInt(payload.trackIndex) - 1;
        var fontFamily     = payload.fontFamily     || "Arial";
        var fontSize       = Number(payload.fontSize) || 60;
        var textColor      = payload.textColor      || [255, 255, 255];
        var highlightColor = payload.highlightColor || [255, 107, 0];
        var bold           = payload.bold           || false;
        var italic         = payload.italic         || false;
	var timelineOffset = parseFloat(payload.timelineOffset) || 0;
	var outlineEnabled = payload.outlineEnabled || false;
        var outlineColor   = payload.outlineColor   || [0, 0, 0];
        var outlineWidth   = Number(payload.outlineWidth) || 3;
        var shadowEnabled  = payload.shadowEnabled  || false;
        var shadowColor    = payload.shadowColor    || [0, 0, 0];
        var shadowOpacity  = Number(payload.shadowOpacity) || 75;
        var shadowDistance  = Number(payload.shadowDistance) || 5;
        var shadowSoftness = Number(payload.shadowSoftness) || 5;
        var bgEnabled      = payload.bgEnabled      || false;
        var bgColor        = payload.bgColor        || [0, 0, 0];
        var bgOpacity      = Number(payload.bgOpacity) || 50;
	var textAnim       = parseInt(payload.textAnim) || 0;
        var hlAnim         = parseInt(payload.hlAnim) || 0;

        if (trackIndex < 0) trackIndex = 0;
        while (seq.videoTracks.numTracks <= trackIndex) {
            seq.videoTracks.addTrack();
        }

        if (lines.length === 0) return '{"error":"lines dizisi bos"}';

        var TICKS = 254016000000;

// ─── Compact JSON oluştur ───
	var seqHeight = parseInt(app.project.activeSequence.frameSizeVertical) || 1080;
        var scaleFactor = seqHeight / 1080;
        var adjustedFontSize = Math.round(fontSize * scaleFactor);
        var jsonBase = parseFloat(lines[0].start);
        if (isNaN(jsonBase)) jsonBase = 0;
        var compactLines = [];
        for (var i = 0; i < lines.length; i++) {
            var line = lines[i];
            var words = line.words || [];
            var wordTimings = [];
            for (var w = 0; w < words.length; w++) {
                var ws = parseFloat(words[w].start);
                var we = parseFloat(words[w].end);
                wordTimings.push(Math.round((ws - jsonBase) * 1000));
                wordTimings.push(Math.round((we - jsonBase) * 1000));
            }
            compactLines.push([
                Math.round((parseFloat(line.start) - jsonBase) * 1000),
                Math.round((parseFloat(line.end) - jsonBase) * 1000),
                line.text,
                wordTimings
            ]);
        }

        var firstStart = parseFloat(lines[0].start);
        var lastEnd    = parseFloat(lines[lines.length - 1].end);

        // ─── ADIM 1: Ana sequence bilgilerini sakla ───
        var mainSeq = seq;
        var mainSeqID = seq.sequenceID;
        var captionSeqName = "CAPTIONS [V]";

        for (var d = app.project.rootItem.children.numItems - 1; d >= 0; d--) {
            var dItem = app.project.rootItem.children[d];
            if (dItem.name === captionSeqName) {
                try { dItem.remove(); } catch(e) {}
            }
        }

        // ─── ADIM 2: Ana sequence'ten bir clip bul ───
        var firstClipItem = null;
        for (var t = 0; t < mainSeq.videoTracks.numTracks; t++) {
            var vt = mainSeq.videoTracks[t];
            if (vt.clips.numItems > 0) {
                firstClipItem = vt.clips[0].projectItem;
                break;
            }
        }

        if (!firstClipItem) {
            for (var p = 0; p < app.project.rootItem.children.numItems; p++) {
                var pItem = app.project.rootItem.children[p];
                if (pItem.type === 1) {
                    firstClipItem = pItem;
                    break;
                }
            }
        }

        // ─── ADIM 3: Caption sequence oluştur ───
        if (firstClipItem) {
            app.project.createNewSequenceFromClips(captionSeqName, [firstClipItem], app.project.rootItem);
        } else {
            app.project.createNewSequence(captionSeqName, captionSeqName);
        }

        var captionSeq = null;
        for (var s = 0; s < app.project.sequences.numSequences; s++) {
            if (app.project.sequences[s].name === captionSeqName) {
                captionSeq = app.project.sequences[s];
                break;
            }
        }

        if (!captionSeq) return '{"error":"Caption sequence olusturulamadi"}';

        // ─── ADIM 4: Caption sequence'i aç ve temizle ───
        app.project.openSequence(captionSeq.sequenceID);
        $.sleep(300);

        for (var vti = 0; vti < captionSeq.videoTracks.numTracks; vti++) {
            var vtrack = captionSeq.videoTracks[vti];
            for (var ci = vtrack.clips.numItems - 1; ci >= 0; ci--) {
                try { vtrack.clips[ci].remove(true, true); } catch(e) {}
            }
        }
        for (var ati = 0; ati < captionSeq.audioTracks.numTracks; ati++) {
            var atrack = captionSeq.audioTracks[ati];
            for (var ai = atrack.clips.numItems - 1; ai >= 0; ai--) {
                try { atrack.clips[ai].remove(true, true); } catch(e) {}
            }
        }

        // ─── ADIM 5: Audio track'ları sil (QE DOM) ───
        try {
            app.enableQE();
            var qeCaptionSeq = qe.project.getActiveSequence();
            if (qeCaptionSeq) {
                for (var ra = qeCaptionSeq.numAudioTracks - 1; ra >= 0; ra--) {
                    try { qeCaptionSeq.removeAudioTrack(ra); } catch(e) {}
                }
            }
        } catch(e) {}

        $.sleep(300);

        // ─── ADIM 6: MOGRT'u caption sequence'e ekle ───
	var startTicks = "0";
        var newClip = captionSeq.importMGT(mogrtPath, startTicks, 0, 0);

        if (!newClip) {
            app.project.openSequence(mainSeqID);
            return '{"error":"importMGT returned null"}';
        }

        // ─── ADIM 7: MOGRT parametrelerini ayarla ───
        var mogrtComp = newClip.getMGTComponent();
        if (!mogrtComp) {
            app.project.openSequence(mainSeqID);
            return '{"error":"getMGTComponent returned null"}';
        }

        var props = mogrtComp.properties;

	try {
            var jsonParam = props.getParamForDisplayName("JSON_Input");
            if (jsonParam) {
                var outlineData = outlineEnabled ? [1, outlineColor[0], outlineColor[1], outlineColor[2], outlineWidth] : [0];
                var shadowData = shadowEnabled ? [1, shadowColor[0], shadowColor[1], shadowColor[2], shadowOpacity, shadowDistance, shadowSoftness] : [0];
                var bgData = bgEnabled ? [1, bgColor[0], bgColor[1], bgColor[2], bgOpacity] : [0];
                jsonParam.setValue(JSON.stringify([highlightColor, textColor, fontFamily, adjustedFontSize, outlineData, shadowData, bgData, textAnim, hlAnim, compactLines]));
            }
        } catch(e) {}

	try {
            var highParam = props.getParamForDisplayName("Highlight_Color");
            if (highParam) {
                highParam.setValue([highlightColor[0] / 255, highlightColor[1] / 255, highlightColor[2] / 255, 1]);
            }
        } catch(e) {}

        try {
            var textColorParam = props.getParamForDisplayName("Text_Color");
            if (!textColorParam) textColorParam = props.getParamForDisplayName("TextColor");
            if (!textColorParam) textColorParam = props.getParamForDisplayName("Fill_Color");
            if (textColorParam) {
                textColorParam.setValue([textColor[0], textColor[1], textColor[2], 255]);
            }
        } catch(e) {}

        // ─── ADIM 8: Ana sequence'e geri dön ───
        app.project.openSequence(mainSeqID);
        $.sleep(300);

        // ─── ADIM 9: Caption sequence'i project panel'de bul ───
        var captionSeqItem = null;
        for (var k = 0; k < app.project.rootItem.children.numItems; k++) {
            var item = app.project.rootItem.children[k];
            if (item.name === captionSeqName) {
                captionSeqItem = item;
                break;
            }
        }

        if (!captionSeqItem) return '{"error":"Caption sequence project panelde bulunamadi"}';

        // ─── ADIM 10: Audio kilitle + nested ekle + audio kilidi aç ───
        for (var lockA = 0; lockA < mainSeq.audioTracks.numTracks; lockA++) {
            try { mainSeq.audioTracks[lockA].setLocked(true); } catch(e) {}
        }

        var mainTrack = mainSeq.videoTracks[trackIndex];
        mainTrack.overwriteClip(captionSeqItem, firstStart);
        $.sleep(300);

        for (var unlockA = 0; unlockA < mainSeq.audioTracks.numTracks; unlockA++) {
            try { mainSeq.audioTracks[unlockA].setLocked(false); } catch(e) {}
        }

        for (var at2 = 0; at2 < mainSeq.audioTracks.numTracks; at2++) {
            var aTrack2 = mainSeq.audioTracks[at2];
            for (var ac2 = aTrack2.clips.numItems - 1; ac2 >= 0; ac2--) {
                try {
                    if (aTrack2.clips[ac2].name === captionSeqName) {
                        aTrack2.clips[ac2].remove(true, true);
                    }
                } catch(e) {}
            }
        }

        // ─── ADIM 11: QE Razor ile kırp ───
        var trimResult = "not_tried";

        try {
            app.enableQE();
            $.sleep(200);

            var timecode = secondsToTimecode(lastEnd, mainSeq);
            var qeSeq2 = qe.project.getActiveSequence();

            if (qeSeq2) {
                var clipsBefore = mainTrack.clips.numItems;

                for (var qi = 0; qi < 8; qi++) {
                    try {
                        var qeT = qeSeq2.getVideoTrackAt(qi);
                        if (qeT) {
                            qeT.razor(timecode);
                            $.sleep(100);
                            var clipsAfter = mainTrack.clips.numItems;

                            if (clipsAfter > clipsBefore) {
                                mainTrack.clips[clipsAfter - 1].remove(true, true);
                                trimResult = "trimmed";
                                break;
                            }
                        }
                    } catch(e) {}
                }
            }
        } catch(e) {}

        if (trimResult !== "trimmed") trimResult = "trim_failed";

        return '{"success":true,"added":1,"total":' + lines.length + ',"words":' + compactLines.length + ',"trim":"' + trimResult + '","method":"nested"}';

    } catch(e) {
        return '{"error":"' + e.toString().replace(/"/g, "'") + '"}';
    }
}

function fmtSRTTime(s) {
    var h  = Math.floor(s / 3600);
    var m  = Math.floor((s % 3600) / 60);
    var sc = Math.floor(s % 60);
    var ms = Math.round((s % 1) * 1000);
    var pad = function(n, l) { var str = String(Math.floor(n)); while(str.length < (l||2)) str = "0" + str; return str; };
    return pad(h) + ":" + pad(m) + ":" + pad(sc) + "," + pad(ms, 3);
}