var audio;
var audioState = {
};
window.timer = new PerformanceTimer();

room.onLoad = function() {
  timer.start('load');
  audioState.listener = room._target.engine.systems.sound.getActiveListener().children[0];
  audioState.context = audioState.listener.context;
  room._target.spawn('ReactiveAudio', null, {});
  timer.stop('load');
}

var lastprint = 0;
room.update = function() {
/*
  timer.start('update');
  // print the summary once a second
  var now = timer.now();
  if (now - lastprint > 1000) {
    print(timer.summarize());
    lastprint = now;
  }
  timer.stop('update');
*/
}

/* Main ReactiveAudio app */
elation.component.add('engine.things.ReactiveAudio', {
  postinit: function() {
    elation.engine.things.ReactiveAudio.extendclass.postinit.call(this);
    elation.events.add(document.body, 'dragover', elation.bind(this, this.handleDragOver));
    elation.events.add(document.body, 'drop', elation.bind(this, this.handleDrop));
  },
  createChildren: function() {
/*
    this.spawn('ReactiveAudioSoundNode', null, {
      src: 'bilar.mp3',
      position: V(-1,0,-3)
    });
    this.spawn('ReactiveAudioPositionalOutputNode', null, {
      position: V(1,0,-3)
    });
*/
  },
  handleDragOver: function(ev) {
    ev.preventDefault();
    ev.dataTransfer.dropEffect = "move"
  },
  handleDrop: function(ev) {
    var files = ev.dataTransfer.files;
    for (var i = 0; i < files.length; i++) {
      var name = files[i].name;
      this.sounds[name] = this.spawn('ReactiveAudioSoundNode', null, {
        position: V(i * 1, 1, -2),
        file: files[i]
      });
    }

    ev.preventDefault();
  }
}, elation.engine.things.janusbase);
/* Node */
elation.component.add('engine.things.ReactiveAudioNode', function() {
  this.postinit = function() {
    this.inputs = {};
    this.outputs = {};

    elation.engine.things.ReactiveAudioNode.extendclass.postinit.call(this);
  }
  this.createObject3D = function() {
    var obj = new THREE.Mesh(new THREE.BoxGeometry(.5,.5,.05), new THREE.MeshPhongMaterial({color: 0x009900}));
    obj.geometry.applyMatrix(new THREE.Matrix4().makeTranslation(0,.25,0));
    return obj;
  }
  this.createChildren = function() {
    this.initIO();
    this.updateLayout();
  }

  this.connect = function(node, outputname) {
  },
  this.initIO = function() {
  },
  this.updateLayout = function() {
    var i = 0,
        height = .1,
        offset = .4;

    for (var k in this.inputs) {
      this.inputs[k].properties.position.y = (i * -height) + offset;
      i++;
    }
    i = 0;
    for (var k in this.outputs) {
      this.outputs[k].properties.position.y = (i * -height) + offset;
      i++;
    }
  }
  this.defineInput = function(name, type) {
    if (!this.inputs[name]) {
      this.inputs[name] = this.spawn('ReactiveAudioNodeInput', null, {
        connectorname: name, 
        node: this,
        position: V(-.275,.2,0)
      });
    }
    return this.inputs[name];
  },
  this.defineOutput = function(name, type, value) {
    if (!this.outputs[name]) {
      this.outputs[name] = this.spawn('ReactiveAudioNodeOutput', null, {
        connectorname: name, 
        node: this,
        value: value,
        position: V(.275,.2,0)
      });
    }
    return this.outputs[name];
  }
  this.createLabel = function(text) {
    var labeltex = elation.engine.materials.getTextureLabel(text, 256, '#fff', 'sans-serif');
    var label = new THREE.Mesh(new THREE.PlaneGeometry(.5,.1), new THREE.MeshPhongMaterial({map: labeltex, transparent: true}));
    label.position.set(0,.45,.055);
    this.objects['3d'].add(label);
  }
  this.show = function() {
    this.visible = true;
  }
  this.hide = function() {
    this.visible = false;
    this.position.y = -9999;
  }
}, elation.engine.things.janusbase);

/* NodeConnector */
elation.component.add('engine.things.ReactiveAudioNodeConnector', {

  postinit: function() {
    elation.engine.things.ReactiveAudioNodeConnector.extendclass.postinit.call(this);
    this.connectortype = 'unspecified';
    this.connectorname = this.args.connectorname;

    this.defineProperties({
      node: { type: 'object' },
      value: { type: 'object' },
    });

    elation.events.add(this, 'mouseover', elation.bind(this, this.handleMouseOver));
    elation.events.add(this, 'mouseout', elation.bind(this, this.handleMouseOut));
    elation.events.add(this, 'mousedown', elation.bind(this, this.handleMouseDown));
    elation.events.add(this, 'mouseup', elation.bind(this, this.handleMouseUp));
    elation.events.add(this, 'click', elation.bind(this, this.handleClick));
  },
  createObject3D: function() {
    var obj = new THREE.Mesh(new THREE.BoxGeometry(.05,.05,.05), new THREE.MeshPhongMaterial({color: 0x990000}));
    this.material = obj.material;
    this.updateColor();
    return obj;
  },
  getValue: function() {
    if (typeof this.value == 'function') {
      return this.value();
    }
    return this.value;
  },
  updateColor: function(skipother) {
    var color = 0x990000;
    if (this.cable) {
      if (this.cable.start && this.cable.end) {
        color = 0x00ff00;
        if (!skipother) {
          if (this.cable.start === this) this.cable.end.updateColor(true);
          if (this.cable.end === this) this.cable.start.updateColor(true);
        }
      } else {
        color = 0xffff00;
      }
    }
    this.material.color.setHex(color);
  },
  handleMouseOver: function(ev) {
    var cable = audioState.activeAudioCable;
    if (cable) {
      if (cable.start.connectortype != this.connectortype) {
        cable.end = this;
      }
    }
    this.updateColor();
  },
  handleMouseOut: function(ev) {
    this.material.color.setHex(0x990000);
    var cable = audioState.activeAudioCable;
    if (cable) {
      cable.end = false;
    }
    this.updateColor();
  },
  handleMouseDown: function(ev) {
    var cable = audioState.activeAudioCable;
    this.material.color.setHex(0x990000);
    if (cable) {
      if (cable.start.connectortype != this.connectortype) {
        this.cable = cable;
        cable.end = this;
        audioState.activeAudioCable = false;
        elation.events.fire({type: 'connect', element: this.cable.start, data: this.cable.end});
        elation.events.fire({type: 'connect', element: this.cable.end, data: this.cable.start});
        cable.attached = true;
      }
    } else {
      this.cable = audioState.activeAudioCable = this.spawn('ReactiveAudioCable', null, {start: this}, true);
      this.material.color.setHex(0x00ff00);
    }
    this.updateColor();
  },
  handleClick: function(ev) {
  },
}, elation.engine.things.janusbase);

/* NodeInput */
elation.component.add('engine.things.ReactiveAudioNodeInput', {
  postinit: function() {
    elation.engine.things.ReactiveAudioNodeInput.extendclass.postinit.call(this);
    this.connectortype = 'input';
  }
}, elation.engine.things.ReactiveAudioNodeConnector);

/* NodeOutput */
elation.component.add('engine.things.ReactiveAudioNodeOutput', {
  postinit: function() {
    elation.engine.things.ReactiveAudioNodeInput.extendclass.postinit.call(this);
    this.connectortype = 'output';
  }
}, elation.engine.things.ReactiveAudioNodeConnector);

/* Cable */
elation.component.add('engine.things.ReactiveAudioCable', {
  audiocontrols: false,
  postinit: function() {
    elation.engine.things.ReactiveAudioCable.extendclass.postinit.call(this);

    if (!this.audiocontrols) {
console.log('INIT AUDIOCONTROLS');
      this.audiocontrols = {
        'null': false,
        'gain': room._target.spawn('ReactiveAudioGainNode', null, {visible: false}),
        'stereosplitter': room._target.spawn('ReactiveAudioStereoSplitterNode', null, {visible: false}),
        'surroundsplitter': room._target.spawn('ReactiveAudioSurroundSplitterNode', null, {visible: false}),
        'lowpass': room._target.spawn('ReactiveAudioLowpassFilterNode', null, {visible: false}),
        'bandpass': room._target.spawn('ReactiveAudioBandpassFilterNode', null, {visible: false}),
        'highpass': room._target.spawn('ReactiveAudioHighpassFilterNode', null, {visible: false}),
        'spectrum': room._target.spawn('ReactiveAudioSpectrumViewerNode', null, {visible: false}),
        'output': room._target.spawn('ReactiveAudioOutputNode', null, {visible: false}),
        'positionaloutput': room._target.spawn('ReactiveAudioPositionalOutputNode', null, {visible: false}),
        'material': room._target.spawn('ReactiveAudioMaterialNode', null, {visible: false}),
        'light': room._target.spawn('ReactiveAudioLightNode', null, {visible: false}),
        'color': room._target.spawn('ReactiveAudioColorNode', null, {visible: false}),
      };
    }
    this.defineProperties({
      start: { type: 'object' },
      end: { type: 'object' },
    });

    this.startpos = new THREE.Vector3();
    this.endpos = new THREE.Vector3();

    elation.events.add(this.engine, 'engine_frame', elation.bind(this, this.update));
    elation.events.add(this, 'mouseover', elation.bind(this, this.handleMouseOver));
    elation.events.add(this, 'mouseout', elation.bind(this, this.handleMouseOut));
    elation.events.add(this, 'click', elation.bind(this, this.handleClick));

    this.controllist = Object.keys(this.audiocontrols);
    this.activecontrol = 0;
    this.activeinput = 0;
    this.attached = false;

    this.controlstate = this.engine.systems.controls.addContext('audiocable', {
      'control_next': ['keyboard_e', elation.bind(this, this.showNextControl)],
      'control_prev': ['keyboard_q', elation.bind(this, this.showPrevControl)],
      'input_next': ['keyboard_r', elation.bind(this, this.selectNextInput)],
      'input_prev': ['keyboard_f', elation.bind(this, this.selectPrevInput)],
      'cancel': ['keyboard_esc', elation.bind(this, this.cancel)],
    });
  },
  createObject3D: function() {
    var obj = new THREE.Mesh(new THREE.CubeGeometry(.01, .01, 1), new THREE.MeshPhongMaterial({color: 0x333333}));
    obj.geometry.applyMatrix(new THREE.Matrix4().makeTranslation(0,0,.5));
    this.material = obj.material;
    return obj;
  },
  update: function() {
    if (this.start) {
      this.start.objects.dynamics.localToWorldPos(this.startpos.set(0,0,0));
    } else {
      this.startpos.copy(player.view_dir).multiplyScalar(1.5).add(player.pos).add(V(0,1.6,0));
    }

    if (this.end) {
      this.end.localToWorld(this.endpos.set(0,0,0));
    } else {
      this.endpos.copy(player.view_dir).multiplyScalar(1.5).add(player.pos).add(V(0,1.6,0));
    }

    if (this.attached) {
      if (this.controlsActive) {
        this.engine.systems.controls.deactivateContext('audiocable', this);
        this.controlsActive = false;
      }
    } else {
      if (!this.controlsActive) {
        this.engine.systems.controls.activateContext('audiocable', this);
        this.controlsActive = true;
      } 
    }

    var diff = new THREE.Vector3();
    diff.subVectors(this.endpos, this.startpos);
    var len = diff.length();
    this.scale.z = len;
    this.properties.position.copy(this.startpos);
    diff.normalize();

    //this.zdir = diff;
    this.objects['3d'].lookAt(this.endpos);

    if (this.activecontrol) {
      var control = this.audiocontrols[this.controllist[this.activecontrol]];
      control.properties.position.copy(this.endpos);

      var inputname = Object.keys(control.inputs)[this.activeinput],
          input = control.inputs[inputname];
      if (input) {
        control.properties.position.sub(input.position);
      } else {
        console.log('dur?', control, inputname, input);
      }
    }
  },
  attach: function(which, connector, temp) {
  },
  cut: function() {
    elation.events.fire({type: 'disconnect', element: this.start});
    elation.events.fire({type: 'disconnect', element: this.end});
    this.die();
  },
  handleMouseOver: function(ev) {
    if (this.start && this.end) {
      this.material.color.setHex(0x990000);
    }
  },
  handleMouseOut: function(ev) {
    if (this.start && this.end) {
      this.material.color.setHex(0x000000);
    }
  },
  handleClick: function(ev) {
    if (this.start && this.end) {
      this.cut();
    }
  },
  getActiveControl: function() {
    return this.audiocontrols[this.controllist[this.activecontrol]];
  },
  setActiveControl: function(controlid) {
    if (this.activecontrol) {
      var currentcontrol = this.getActiveControl();
      if (currentcontrol) currentcontrol.hide();
    }
    var controlname = this.controllist[controlid];
    this.activecontrol = controlid;
    this.activeinput = 0;

    var newcontrol = this.getActiveControl();
    if (newcontrol) newcontrol.show();
  }, 
  showNextControl: function(ev) {
    if (ev.value == 1) {
      var controlid = (this.activecontrol + 1) % this.controllist.length;
      console.log('next guy', controlid, this.controllist[controlid]);
      this.setActiveControl(controlid);
    }
  },
  showPrevControl: function(ev) {
    if (ev.value == 1) {
      var controlid = (this.activecontrol + this.controllist.length - 1) % this.controllist.length;
      console.log('prev guy', controlid, this.controllist[controlid]);
      this.setActiveControl(controlid);
    }
  },
  selectNextInput: function(ev) {
    if (ev.value == 1) {
      var control = this.getActiveControl();
      if (control) {
        var numinputs = Object.keys(control.inputs).length;
        this.activeinput = (this.activeinput + numinputs - 1) % numinputs;
      }
    }
  },
  selectPrevInput: function(ev) {
    if (ev.value == 1) {
      var control = this.getActiveControl();
      if (control) {
        var numinputs = Object.keys(control.inputs).length;
        this.activeinput = (this.activeinput + 1) % numinputs;
      }
    }
  },
  cancel: function(ev) {
    audioState.activeAudioCable = false;
    this.setActiveControl(0);
    this.cut();
  },
  
}, elation.engine.things.janusbase);

/* SoundNode */
elation.component.add('engine.things.ReactiveAudioSoundNode', {
  postinit: function() {
    elation.engine.things.ReactiveAudioSoundNode.extendclass.postinit.call(this);
    this.defineProperties({
      file: { type: 'object' },
      src: { type: 'string' },
      playing: { type: 'boolean', default: false }
    });
  },
  createChildren: function() {
    var ctx = audioState.listener.context;
    this.audio = ctx.createBufferSource();
    this.audio.loop = true;
    if (this.src) {
      //this.janusaudio = room.createObject('Sound', { id: this.src, auto_play: true, pos: this.position });
      var foo = room._target.getAsset('sound', this.src);
      elation.net.get(foo.getProxiedURL(), null, {
        responseType: 'arraybuffer',
        callback: elation.bind(this, function(data) {
          this.parseAudio(data);
        })
      });

    } else if (this.file) {
      //var janusaudio = this.janusaudio = room.createObject('Sound', { auto_play: false, pos: this.position });
      var reader = new FileReader();
      elation.events.fire({type: 'started', element: this});
      reader.onload = elation.bind(this, function(e) {
        this.parseAudio(e.target.result);
      });
      reader.readAsArrayBuffer(this.file);
    }

    elation.engine.things.ReactiveAudioSoundNode.extendclass.createChildren.call(this);

    this.createLabel('Sound');

    this.spawn('ui3d_button', null, {
      label: 'play',
      position: V(0,.2,.05),
      uievents: {
        click: elation.bind(this, this.togglePlay)
      }
    });
  },
  parseAudio: function(data) {
    var audio = this.audio;
    elation.events.fire({type: 'processing', element: this});
    audio.context.decodeAudioData(data, function ( audioBuffer ) {
      elation.events.fire({type: 'load', element: this});
      audio.buffer = audioBuffer;
      //audio.stop();
    });
  },
  initIO: function() {
    var output = this.defineOutput('stereo', 'audio', elation.bind(this, function() { return this.audio; }));
    elation.events.add(output, 'connect', elation.bind(this, this.handleConnectOutput));
    elation.events.add(output, 'disconnect', elation.bind(this, this.handleDisconnectOutput));
  },
  handleLoad: function(ev) {
    console.log('got it!', ev);
  },
  handleConnectOutput: function(ev) {
    console.log('[SoundNode] connected!', ev);
    //if (!this.audio) {
    //  this.audio = this.janusaudio._target.audio;
    //}
    var other = ev.data.node;
console.log('go sound go', this.audio, other);
    if (!this.playing) {
      this.start();
    }
  },
  handleDisconnectOutput: function(ev) {
    console.log('[SoundNode] disconnected!', ev);
    if (this.audio) {
      //this.audio.pause();
      this.playing = false;
    }
  },
  stop: function() {
    this.audio.pause();
    this.playing = false;
  },
  start: function() {
    this.audio.start(0, 0);
    this.playing = true;
  },
  togglePlay: function(ev) {
    if (this.playing) {
      this.stop();
    } else {
      this.start();
    }
  }
}, elation.engine.things.ReactiveAudioNode);

/* GainNode */
elation.component.add('engine.things.ReactiveAudioGainNode', {
  initIO: function() {
    this.gain = audioState.context.createGain();

    this.defineInput('in', 'audio');
    this.defineInput('gain', 'number');
    this.defineOutput('out', 'audio', elation.bind(this, function() { return this.gain; }));

    elation.events.add(this.inputs['in'], 'connect', elation.bind(this, this.handleAudioConnect));
    elation.events.add(this.inputs['gain'], 'connect', elation.bind(this, this.handleGainConnect));
  },
  createChildren: function() {
    elation.engine.things.ReactiveAudioGainNode.extendclass.createChildren.call(this);
    this.createLabel('Gain');
  },
  handleAudioConnect: function(ev) {
    var audionode = ev.data.getValue();
    audionode.connect(this.gain);
  },
  handleGainConnect: function(ev) {
    var input = ev.data;
    this.gain.gain.value = input.getValue();
    elation.events.add(input, 'change', elation.bind(this, this.updateGain)); 
  },
  updateGain: function(ev) {
    var input = ev.target;
    this.gain.gain.value = input.getValue();
    console.log('set gain', this.gain.gain.value);
  }
}, elation.engine.things.ReactiveAudioNode);

/* StereoSplitterNode */
elation.component.add('engine.things.ReactiveAudioStereoSplitterNode', {
  initIO: function() {
    this.gain_left = audioState.context.createGain();
    this.gain_right = audioState.context.createGain();
    this.splitter = audioState.context.createChannelSplitter(2);

    this.splitter.connect(this.gain_left, 0);
    this.splitter.connect(this.gain_right, 1);

    this.defineInput('in', 'audio');
    this.defineOutput('left', 'audio', elation.bind(this, function() { return this.gain_left; }));
    this.defineOutput('right', 'audio', elation.bind(this, function() { return this.gain_right; }));

    elation.events.add(this.inputs['in'], 'connect', elation.bind(this, this.handleConnect));
  },
  createChildren: function() {
    elation.engine.things.ReactiveAudioStereoSplitterNode.extendclass.createChildren.call(this);
    this.createLabel('Stereo Split');
  },
  handleConnect: function(ev) {
    var audionode = ev.data.getValue();
    audionode.connect(this.splitter);
  }
}, elation.engine.things.ReactiveAudioNode);

/* SurroundSplitterNode */
elation.component.add('engine.things.ReactiveAudioSurroundSplitterNode', {
  initIO: function() {
    this.gain_left_front = audioState.context.createGain();
    this.gain_right_front = audioState.context.createGain();
    this.gain_left_surround = audioState.context.createGain();
    this.gain_right_surround = audioState.context.createGain();
    this.gain_center = audioState.context.createGain();
    this.gain_sub = audioState.context.createGain();

    this.splitter = audioState.context.createChannelSplitter(6);

    this.splitter.connect(this.gain_left_front, 0);
    this.splitter.connect(this.gain_right_front, 1);
    this.splitter.connect(this.gain_center, 2);
    this.splitter.connect(this.gain_sub, 3);
    this.splitter.connect(this.gain_left_surround, 4);
    this.splitter.connect(this.gain_right_surround, 5);


    this.defineInput('in', 'audio');
    this.defineOutput('front_left', 'audio', elation.bind(this, function() { return this.gain_left_front; }));
    this.defineOutput('center', 'audio', elation.bind(this, function() { return this.gain_center; }));
    this.defineOutput('front_right', 'audio', elation.bind(this, function() { return this.gain_right_front; }));
    this.defineOutput('rear_right', 'audio', elation.bind(this, function() { return this.gain_right_surround; }));
    this.defineOutput('rear_left', 'audio', elation.bind(this, function() { return this.gain_left_surround; }));
    this.defineOutput('sub', 'audio', elation.bind(this, function() { return this.gain_sub; }));

    elation.events.add(this.inputs['in'], 'connect', elation.bind(this, this.handleConnect));
  },
  createChildren: function() {
    elation.engine.things.ReactiveAudioSurroundSplitterNode.extendclass.createChildren.call(this);
    this.createLabel('Surround Split');
  },
  handleConnect: function(ev) {
    var audionode = ev.data.getValue();
    audionode.connect(this.splitter);
  }
}, elation.engine.things.ReactiveAudioNode);

/* SpectrumViewer */
elation.component.add('engine.things.ReactiveAudioSpectrumViewerNode', {
  initIO: function() {

    this.fftSize = 256;
    this.numfreqs = this.fftSize / 2
    this.width = 0.5;

    this.defineInput('sound', 'audio');
    this.defineInput('scale', 'number');
    this.defineInput('color', 'color');
    this.defineOutput('sound', 'audio', elation.bind(this, function() { return this.analyser; }) );

    elation.events.add(this.inputs['sound'], 'connect', elation.bind(this, this.handleConnect));
  },
  createChildren: function() {
    elation.engine.things.ReactiveAudioSpectrumViewerNode.extendclass.createChildren.call(this);
    this.createLabel('Spectrum');
  },
  handleConnect: function(ev) {
    var other = ev.data.node;
    var node = ev.data.getValue();
    console.log('[SpectrumViewerNode] connected!', other, node);
    this.initAnalyser(node);
  },
  initAnalyser: function(audionode) {
    var analyser = audioState.context.createAnalyser();
    analyser.fftSize = this.fftSize !== undefined ? this.fftSize : 2048;

console.log('connect:', audionode, analyser);
    audionode.connect(analyser);
    this.analyser = analyser;
    this.freqdata = new Uint8Array(analyser.frequencyBinCount);

    var spacing = 1.0;
    var dir = (this.width < 0 ? -1 : 1);
    var width = (this.width / spacing) / this.numfreqs * dir;

    this.boxes = [];
    for (var i = 0; i < this.numfreqs; i++) {
      var box = room.createObject('Object', { 
        id: 'cube',
        image_id: 'gradient',
        scale: V(width, 1, .05),
        col: V(1,1,1),
        cull_face: 'none'
      });
      this.boxes[i] = box;
      box._target.reparent(this);
      box.pos = V(dir * width * i * spacing - (width * 0.5 * this.numfreqs), 0, .05);
    }
    elation.events.add(this.engine, 'engine_frame', elation.bind(this, this.update));
  },
  update: function(dt) {
    if (this.analyser) {
      this.analyser.getByteFrequencyData(this.freqdata);
      for (var i = 0; i < this.freqdata.length; i++) {
        var box = this.boxes[i];
        //box.col.g = this.freqdata[i];
        box.scale.y = .0001 + this.freqdata[i] / 1024;
        box.pos.y = (box.scale.y / 2);
      }
    }
  }
}, elation.engine.things.ReactiveAudioNode);

/* Output */
elation.component.add('engine.things.ReactiveAudioOutputNode', {
  initIO: function() {
    var output = this.defineInput('sound', 'audio');

    elation.events.add(output, 'connect', elation.bind(this, this.handleConnect));
  },
  createChildren: function() {
    elation.engine.things.ReactiveAudioOutputNode.extendclass.createChildren.call(this);
    this.createLabel('Output');
  },
  handleConnect: function(ev) {
    var other = ev.data;
    console.log('connect:', this, other);

    var audionode = other.getValue();
    if (audionode) {
      var output = this.getOutput(audionode);
      //audionode.disconnect();
      //audionode.connect(output);
    }
  },
  getOuput: function(audionode) {
    return audionode.ctx.destination;
  }
}, elation.engine.things.ReactiveAudioNode);

/* PositionalOutput */
elation.component.add('engine.things.ReactiveAudioPositionalOutputNode', {
  createChildren: function() {
    elation.engine.things.ReactiveAudioOutputNode.extendclass.createChildren.call(this);
    this.createLabel('PositionalOutput');
  },
  getOutput: function(audionode) {
    if (!this.panner) {
      var ctx = audionode.context;
      var dest = audioState.listener.getInput();

      var panner = ctx.createPanner();
      panner.panningModel = 'HRTF';
      audionode.connect(panner);
      panner.refDistance = 10;
      panner.connect(dest);
      this.panner = panner;

      this.update();
    }
    return this.panner;
  },
  update: function() {
    if (this.panner) {
console.log(this.panner, this.position.toArray());
      this.panner.setPosition(this.position.x, this.position.y, this.position.z);
    }
  }
}, elation.engine.things.ReactiveAudioOutputNode);

/* Material */
elation.component.add('engine.things.ReactiveAudioMaterialNode', {
  initIO: function() {
    this.defineInput('sound', 'audio');
  },
  createChildren: function() {
    elation.engine.things.ReactiveAudioMaterialNode.extendclass.createChildren.call(this);
    this.createLabel('Material');
  }
}, elation.engine.things.ReactiveAudioNode);

/* Light */
elation.component.add('engine.things.ReactiveAudioLightNode', {
  initIO: function() {
    this.fftSize = 256;
    this.numfreqs = this.fftSize / 2
    this.width = 0.5;
    this.averages = [];
    this.averagecount = 240;
    this.averageindex = 0;
    this.intensity = 0;

    this.defineInput('sound', 'audio');
    this.defineInput('color', 'color');

    elation.events.add(this.inputs['sound'], 'connect', elation.bind(this, this.handleConnect));
  },
  createChildren: function() {
    elation.engine.things.ReactiveAudioLightNode.extendclass.createChildren.call(this);
    this.light = this.spawn('januslight', null, {
      color: 0xffffff * Math.random(),
      
    });
    this.createLabel('Light');
  },
  handleConnect: function(ev) {
    var other = ev.data.node;
    var node = ev.data.getValue();
    console.log('[LightNode] connected!', other, node);
    this.initAnalyser(node);
  },
  initAnalyser: function(audionode) {
    var analyser = audioState.context.createAnalyser();
    analyser.fftSize = this.fftSize !== undefined ? this.fftSize : 2048;

    audionode.connect(analyser);
    this.analyser = analyser;
    this.freqdata = new Uint8Array(analyser.frequencyBinCount);

    elation.events.add(this.engine, 'engine_frame', elation.bind(this, this.update));
  },
  update: function(dt) {
    // Update is called once per frame
    if (this.analyser) {
      this.analyser.getByteFrequencyData(this.freqdata);


      var avg = this.getCurrentAverage(),
          movingaverage = this.getMovingAverage(),
          peak = this.getPeak(),
          min = this.getMin() - .01; // avoid divide-by-zero errors

      this.averages[this.averageindex] = avg;
      this.averageindex = (this.averageindex + 1) % this.averagecount;

      var intensity = Math.max(0, (avg - min) / (peak - min)) * 10;

      this.intensity = intensity; //+= (intensity - this.intensity) * 0.4;

      this.light.light_intensity = this.intensity * 20;
console.log(this.intensity.toFixed(4), intensity.toFixed(4), peak.toFixed(4), avg.toFixed(4), movingaverage.toFixed(4));
    }
  },
  getCurrentAverage: function() {
    var freqs = this.freqdata;
    var sum = 0;
    for(var i = 0; i < freqs.length; i++) {
      sum += freqs[i];
    }
    return sum / freqs.length;
  },
  getMovingAverage: function() {
    var sum = 0;
    for (var i = 0; i < this.averages.length; i++) {
      sum += this.averages[i];
    }
    return sum / this.averages.length;
  },
  getMin: function() {
    var min = 100;
    for (var i = 0; i < this.averages.length; i++) {
      if (this.averages[i] < min) min = this.averages[i];
    }
    return min;
  },
  getPeak: function() {
    var peak = 0;
    for (var i = 0; i < this.averages.length; i++) {
      if (this.averages[i] > peak) peak = this.averages[i];
    }
    return peak;
  }
}, elation.engine.things.ReactiveAudioNode);

/* ui3d_button */
elation.component.add('engine.things.ui3d_button', {
  postinit: function() {
    elation.engine.things.ui3d_button.extendclass.postinit.call(this);
    this.defineProperties({
      label: { type: 'string', default: 'Go' },
      uievents: { type: 'object', default: {} }
    });

console.log('der', this.uievents);
    for (var k in this.uievents) {
console.log('add event:', k);
      elation.events.add(this, k, this.uievents[k]);
    }
  },
  createObject3D: function() {
    return new THREE.Mesh(new THREE.BoxGeometry(.3,.1,.01), new THREE.MeshPhongMaterial({color: 0xcccccc}));
  }
}, elation.engine.things.janusbase);





/* TIMING TESTS */
function PerformanceTimer() {
  this.history = {};
  this.timers = {};
}
PerformanceTimer.prototype.now = function() {
  if (typeof performance != 'undefined') {
    return performance.now();
  }
  return new Date().getTime();
}
PerformanceTimer.prototype.start = function(name) {
  if (!this.timers[name]) {
    this.timers[name] = this.now();
  }
}
PerformanceTimer.prototype.stop = function(name) {
  if (this.timers[name]) {
    var now = this.now(),
        diff = now - this.timers[name];
    if (!this.history[name]) this.history[name] = [];
    this.history[name].push(diff);
    delete this.timers[name];
  }
}
PerformanceTimer.prototype.summarize = function() {
  var summary = '';
  for (var k in this.history) {
    var timings = this.history[k],
        num = timings.length,
        total = 0;
     for (var i = 0; i < num; i++) {
       total += timings[i];
     }
     var avg = total / num;
     summary += k + ': ' + num + ' calls, ' + avg.toFixed(2) + 'ms per call, ' + total.toFixed(2) + 'ms total\n'
  }
  return summary;
}

/* FilterNode */
elation.component.add('engine.things.ReactiveAudioFilterNode', {
  initIO: function() {
    this.initFilter();

    this.defineInput('in', 'audio');
    this.defineOutput('out', 'audio', elation.bind(this, function() { return this.filter; }));

    elation.events.add(this.inputs['in'], 'connect', elation.bind(this, this.handleConnect));
  },
  initFilter: function() {
    this.createFilter(false);
  },
  createFilter: function(type, args) {
    if (!args) args = {};

    if (!this.filter) {
      this.filter = audioState.context.createBiquadFilter();
    }

    var filter = this.filter;

    if (type) {
      filter.type = type;
      if (args.frequency) filter.frequency.value = args.frequency;
      if (args.gain) filter.gain.value = args.gain;
      if (args.Q) filter.Q.value = args.Q;
      if (args.detune) filter.detune.value = args.detune;
    }
  },
  createChildren: function() {
    elation.engine.things.ReactiveAudioFilterNode.extendclass.createChildren.call(this);
    this.createLabel('Filter');
  },
  handleConnect: function(ev) {
    var audionode = ev.data.getValue();
    audionode.connect(this.filter);
  }
}, elation.engine.things.ReactiveAudioNode);

/* LowpassFilterNode */
elation.component.add('engine.things.ReactiveAudioLowpassFilterNode', {
  initFilter: function() {
    this.createFilter('lowpass', { frequency: 100 });
  },
  createChildren: function() {
    elation.engine.things.ReactiveAudioFilterNode.extendclass.createChildren.call(this);
    this.createLabel('Lowpass');
  },
}, elation.engine.things.ReactiveAudioFilterNode);

/* BandpassFilterNode */
elation.component.add('engine.things.ReactiveAudioBandpassFilterNode', {
  initFilter: function() {
    this.createFilter('bandpass', { frequency: 1000 });
  },
  createChildren: function() {
    elation.engine.things.ReactiveAudioFilterNode.extendclass.createChildren.call(this);
    this.createLabel('Bandpass');
  },
}, elation.engine.things.ReactiveAudioFilterNode);

/* HighpassFilterNode */
elation.component.add('engine.things.ReactiveAudioHighpassFilterNode', {
  initFilter: function() {
    this.createFilter('highpass', { frequency: 4000 });
  },
  createChildren: function() {
    elation.engine.things.ReactiveAudioFilterNode.extendclass.createChildren.call(this);
    this.createLabel('Highpass');
  },
}, elation.engine.things.ReactiveAudioFilterNode);

/* FilterNode */
elation.component.add('engine.things.ReactiveAudioColorNode', {
  initIO: function() {
    this.color = 0xff0000;
    this.defineOutput('color', 'color', elation.bind(this, function() { return this.color; }));
  },
  createChildren: function() {
    elation.engine.things.ReactiveAudioColorNode.extendclass.createChildren.call(this);
    this.createLabel('Color');

    this.spawn('janusimage', null, { id: 'https://www.w3schools.com/colors/img_colormap.gif' });
  },
  handleConnect: function(ev) {
    var audionode = ev.data.getValue();
    audionode.connect(this.filter);
  }
}, elation.engine.things.ReactiveAudioNode);
