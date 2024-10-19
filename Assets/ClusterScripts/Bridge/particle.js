const maxPlayTime = 8.0;

$.onStart(() => {
  $.state.playTime = -1;
});

/**
 * schema
 * any = {
 *   play: bool;
 * }
 */
$.onReceive((id, body, _) => {
  if (body.play) {
    $.getUnityComponent("ParticleSystem").play();
    $.state.playTime = 0;
  } else {
    $.getUnityComponent("ParticleSystem").stop();
  }
});

$.onUpdate(dt => {
  if ($.state.playTime < 0) {
    return;
  }
  
  const playTime = $.state.playTime + dt;
  if (playTime >= maxPlayTime) {
    $.state.playTime = -1;
    $.getUnityComponent("ParticleSystem").stop();
  } else {
    $.state.playTime = playTime;
  }
});