document.addEventListener('DOMContentLoaded', function () {
  const video = document.getElementById('demo-video');
  const dataset = document.getElementById('demo-dataset');
  const caseSelect = document.getElementById('demo-case');
  const view = document.getElementById('demo-view');
  const playButton = document.getElementById('demo-play');
  const resetButton = document.getElementById('demo-reset');
  const caseLabel = document.getElementById('demo-case-label');
  const time = document.getElementById('demo-time');
  const error = document.getElementById('demo-error');

  if (!video || !dataset || !caseSelect || !view || !playButton || !resetButton || !caseLabel || !time || !error) return;

  const cases = {
    suturebot: [
      { id: 'suturebot_001187', episode: '001187', frames: 73 },
      { id: 'suturebot_001244', episode: '001244', frames: 73 }
    ],
    srth: [
      { id: 'srth_000129', episode: '000129', frames: 25 },
      { id: 'srth_000542', episode: '000542', frames: 25 }
    ],
    cao: [
      { id: 'cao_000414', episode: '000414', frames: 13 },
      { id: 'cao_000568', episode: '000568', frames: 13 }
    ]
  };
  const mediaBase = 'static/videos/surgcast-oracle/';
  let loadId = 0;

  function selectedCase() {
    return (cases[dataset.value] || []).find(item => item.id === caseSelect.value);
  }

  function populateCases() {
    const options = (cases[dataset.value] || []).map(item => {
      const option = document.createElement('option');
      option.value = item.id;
      option.textContent = `Episode ${item.episode}`;
      return option;
    });
    caseSelect.replaceChildren(...options);
  }

  function updateTime() {
    const current = Number.isFinite(video.currentTime) ? video.currentTime : 0;
    const selected = selectedCase();
    const fallbackDuration = selected ? selected.frames / 6 : 0;
    const duration = Number.isFinite(video.duration) ? video.duration : fallbackDuration;
    time.textContent = `${current.toFixed(1)} / ${duration.toFixed(1)} s`;
  }

  function updatePlayButton() {
    playButton.textContent = video.ended ? 'Replay' : video.paused ? 'Play' : 'Pause';
  }

  function showError(message) {
    error.textContent = message;
    error.hidden = !message;
  }

  function switchVideo(preservePosition) {
    const selected = selectedCase();
    if (!selected) return;

    const position = preservePosition && Number.isFinite(video.currentTime) ? video.currentTime : 0;
    const resume = preservePosition && !video.paused;
    const requestId = ++loadId;
    const suffix = view.value === 'skeleton' ? '_oracle_skeleton.mp4' : '.mp4';

    video.pause();
    video.poster = mediaBase + selected.id + '_initial.png';
    video.src = mediaBase + selected.id + suffix;
    video.addEventListener('loadedmetadata', function restorePosition() {
      if (requestId !== loadId) return;
      if (position > 0) video.currentTime = Math.min(position, video.duration || position);
      updateTime();
      if (resume) video.play().catch(() => showError('Playback was blocked. Press Play to continue.'));
    }, { once: true });
    video.load();

    const datasetName = dataset.options[dataset.selectedIndex].textContent;
    caseLabel.textContent = `${datasetName} · Episode ${selected.episode}`;
    showError('');
    updatePlayButton();
    if (!preservePosition) time.textContent = `0.0 / ${(selected.frames / 6).toFixed(1)} s`;
  }

  dataset.addEventListener('change', function () {
    populateCases();
    switchVideo(false);
  });
  caseSelect.addEventListener('change', function () { switchVideo(false); });
  view.addEventListener('change', function () { switchVideo(true); });

  playButton.addEventListener('click', function () {
    if (!video.paused) {
      video.pause();
      return;
    }
    if (video.ended) video.currentTime = 0;
    showError('');
    video.play().catch(() => showError('This video could not be played. Please try another browser.'));
  });

  resetButton.addEventListener('click', function () {
    video.pause();
    video.currentTime = 0;
    showError('');
    updateTime();
    updatePlayButton();
  });

  video.addEventListener('timeupdate', updateTime);
  video.addEventListener('loadedmetadata', updateTime);
  video.addEventListener('play', updatePlayButton);
  video.addEventListener('pause', updatePlayButton);
  video.addEventListener('ended', updatePlayButton);
  video.addEventListener('error', function () { showError('Demo media could not be loaded.'); });

  populateCases();
  switchVideo(false);
});
