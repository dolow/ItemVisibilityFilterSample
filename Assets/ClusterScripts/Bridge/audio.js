/**
 * schema
 * any = {
 *   play: bool;
 * }
 */
$.onReceive((id, body, _) => {
  if (body.play) {
    $.getUnityComponent("AudioSource").play();
  } else {
    $.getUnityComponent("AudioSource").stop();
  }
});