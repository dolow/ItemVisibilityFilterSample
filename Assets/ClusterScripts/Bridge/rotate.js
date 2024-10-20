const degreePerSec = 90.0;

$.onUpdate(dt => {
  const euler = $.getRotation().createEulerAngles();
  const newY = (euler.y + degreePerSec * dt) % 360;
  $.setRotation(new Quaternion().setFromEulerAngles(new Vector3(euler.x, newY, euler.z)));
});