// This adapter uses the experience's bundled Three.js constructors so that the
// downloaded character shares the existing renderer, flight path and reveal.
export function createMickeyCharacter(THREE, {
  url = '/models/mickey-mouse.glb',
  scale = 2,
} = {}) {
  const { Group, Vector3, Box3, GLTFLoader, AnimationMixer } = THREE;
  const group = new Group();
  const root = new Group();
  const pose = new Group();
  group.name = 'Mickey Mouse character';
  root.name = 'Mickey Mouse flight root';
  pose.name = 'Mickey Mouse idle motion';
  group.add(root);
  root.add(pose);

  // By updates these throughout the reveal. Keep its interface without applying
  // the original human-skin shader or the human model's fixed eye positions.
  const uniforms = {
    uRim: { value: 0 },
    uShade: { value: 1 },
    uCharge: { value: 0 },
    uChargeT: { value: 0 },
  };
  const state = {
    ready: false,
    model: null,
    head: null,
    error: null,
    bones: {},
    rest: {},
    eyes: [],
    halos: [],
  };
  const boundsPoints = [];
  const rig = {};
  const axes = [new Vector3(1, 0, 0), new Vector3(0, 1, 0), new Vector3(0, 0, 1)];
  const radians = Math.PI / 180;
  let mixer = null;

  function prepareRig() {
    const canonical = (name) => name.replace(/[^a-z0-9]/gi, '').toLowerCase();
    const named = new Map(Object.values(state.bones).map((bone) => [canonical(bone.name), bone]));
    const find = (name) => named.get(canonical(name));
    pose.updateWorldMatrix(true, true);
    const modelInverse = pose.getWorldQuaternion(pose.quaternion.clone()).invert();
    for (const side of ['L', 'R']) {
      for (const part of ['upper_arm', 'forearm', 'hand', 'thigh', 'shin']) {
        const bone = find(`DEF-${part}.${side}`);
        if (!bone) continue;
        const model = bone.getWorldQuaternion(bone.quaternion.clone()).premultiply(modelInverse);
        const key = `${part}${side}`;
        rig[key] = {
          bone,
          local: bone.quaternion.clone(),
          model,
          inverse: model.clone().invert(),
          delta: model.clone().identity(),
          step: model.clone().identity(),
        };
        state.rest[key] = rig[key];
      }
    }
    // The deforming head in this Rigify export is DEF-spine.006; the separate
    // control named "head" does not deform its visible mesh.
    const head = find('DEF-spine.006') || find('head');
    if (head) {
      state.head = head;
      const model = head.getWorldQuaternion(head.quaternion.clone()).premultiply(modelInverse);
      rig.head = {
        bone: head,
        local: head.quaternion.clone(),
        model,
        inverse: model.clone().invert(),
        delta: model.clone().identity(),
        step: model.clone().identity(),
      };
      state.rest.head = rig.head;
    }
  }

  function rotateBone(key, x = 0, y = 0, z = 0) {
    const entry = rig[key];
    if (!entry) return;
    entry.delta.identity();
    [x, y, z].forEach((angle, axis) => {
      entry.delta.multiply(entry.step.setFromAxisAngle(axes[axis], angle * radians));
    });
    // Apply model-space motion in the imported bone's rest frame rather than
    // assuming that Rigify's local bone axes match the model axes.
    entry.bone.quaternion.copy(entry.local)
      .multiply(entry.inverse).multiply(entry.delta).multiply(entry.model);
  }

  function updateRig(time, flight, waking) {
    for (const side of ['L', 'R']) {
      const direction = side === 'L' ? -1 : 1;
      const phase = side === 'L' ? 0 : Math.PI;
      const sway = Math.sin(time * 1.1 + phase);
      const lowered = 55 + (24 - 55) * flight;
      rotateBone(`upper_arm${side}`, 2 * sway * flight, 0,
        direction * (lowered + sway * (1.5 + flight * 2)));
      rotateBone(`forearm${side}`, 0,
        direction * (10 + flight * 6 + Math.sin(time * 1.25 + phase) * 2), 0);
      rotateBone(`hand${side}`, Math.sin(time * 1.5 + phase) * 3, 0,
        direction * Math.sin(time * 0.9 + phase) * 2);
      rotateBone(`thigh${side}`, Math.sin(time * 1.6 + phase) * 4 * flight);
      rotateBone(`shin${side}`, (3 + Math.sin(time * 1.6 + phase) * 3) * flight);
    }
    rotateBone('head', Math.sin(time * 0.8) * (1 + waking),
      Math.sin(time * 0.55) * 2.5 * (1 - flight));
  }

  function reportFailure(error) {
    state.error = error instanceof Error ? error.message : String(error);
    console.warn('[Mickey Mouse character]', error);
    if (typeof document === 'undefined') return;
    let notice = document.getElementById('character-load-status');
    if (!notice) {
      notice = document.createElement('p');
      notice.id = 'character-load-status';
      notice.setAttribute('role', 'status');
      notice.setAttribute('aria-live', 'polite');
      Object.assign(notice.style, {
        position: 'fixed',
        top: '70px',
        left: '50%',
        transform: 'translateX(-50%)',
        maxWidth: 'calc(100vw - 32px)',
        width: 'max-content',
        padding: '10px 14px',
        borderRadius: '10px',
        border: '1px solid #ffffff30',
        background: '#171719f2',
        color: '#f2eee7',
        font: '12px/1.5 Arial, sans-serif',
        textAlign: 'center',
        zIndex: '70',
      });
      document.body.appendChild(notice);
    }
    notice.textContent = 'The Mickey Mouse model could not load. Refresh the page to try again.';
  }

  function attach(gltf) {
    const scene = gltf.scene || gltf.scenes?.[0];
    if (!scene) throw new Error('The character file contains no scene.');
    scene.updateMatrixWorld(true);
    const bounds = new Box3().setFromObject(scene);
    const size = bounds.getSize(new Vector3());
    const center = bounds.getCenter(new Vector3());
    let torso = null;
    scene.traverse((node) => {
      if (node.isBone && node.name.replace(/[^a-z0-9]/gi, '').toLowerCase() === 'defspine') torso = node;
    });
    if (torso) {
      const anchor = torso.getWorldPosition(new Vector3());
      // The long backward tail must not move the torso away from the camera's
      // flight path. Keep vertical centering based on the full body height.
      center.x = anchor.x;
      center.z = anchor.z;
    }
    if (![size.x, size.y, size.z, center.x, center.y, center.z].every(Number.isFinite)
      || size.y <= 0 || !Number.isFinite(scale) || scale <= 0) {
      throw new Error('The character has invalid bounds or scale.');
    }

    const factor = 1.9 * scale / size.y;
    const normalized = new Group();
    normalized.name = 'Mickey Mouse normalized model';
    normalized.scale.setScalar(factor);
    normalized.position.copy(center).multiplyScalar(-factor);
    normalized.add(scene);
    pose.add(normalized);

    // Do not replace the imported materials: Mickey's face, gloves, shorts and
    // shoes should retain the model artist's textures and colors.
    scene.traverse((node) => {
      if (node.isMesh) {
        node.castShadow = true;
        node.receiveShadow = true;
        node.frustumCulled = false;
      }
      if (node.isBone) {
        state.bones[node.name] = node;
        if (!state.head && /head/i.test(node.name)) state.head = node;
      }
    });

    prepareRig();
    updateRig(0, 0, 0);
    pose.updateWorldMatrix(true, true);

    if (!state.head) {
      const head = new Group();
      head.name = 'Mickey Mouse head anchor';
      head.position.y = size.y * factor * 0.35;
      pose.add(head);
      state.head = head;
    }

    // Fit the relaxed character instead of its wider imported T-pose. Convert
    // mesh corners into pose-local space, including the torso centering offset.
    const posedBounds = new Box3().makeEmpty();
    scene.traverse((node) => {
      if (!node.isMesh) return;
      if (node.isSkinnedMesh) node.computeBoundingBox();
      else if (!node.geometry.boundingBox) node.geometry.computeBoundingBox();
      const box = node.isSkinnedMesh ? node.boundingBox : node.geometry.boundingBox;
      if (!box || box.isEmpty()) return;
      for (const x of [box.min.x, box.max.x]) {
        for (const y of [box.min.y, box.max.y]) {
          for (const z of [box.min.z, box.max.z]) {
            const corner = node.localToWorld(new Vector3(x, y, z));
            posedBounds.expandByPoint(pose.worldToLocal(corner));
          }
        }
      }
    });
    if (posedBounds.isEmpty()) throw new Error('The character contains no visible mesh bounds.');
    for (const x of [posedBounds.min.x, posedBounds.max.x]) {
      for (const y of [posedBounds.min.y, posedBounds.max.y]) {
        for (const z of [posedBounds.min.z, posedBounds.max.z]) {
          boundsPoints.push(new Vector3(x, y, z));
        }
      }
    }

    const clips = gltf.animations || [];
    const idle = clips.find((clip) => /idle|breath|stand/i.test(clip.name));
    // A native idle is safe to loop in the existing camera path. Locomotion
    // clips can contain root translation, so leave those to the flight rig.
    if (idle && AnimationMixer) {
      mixer = new AnimationMixer(scene);
      mixer.clipAction(idle).play();
    }
    state.model = pose;
    state.ready = true;
    state.error = null;
    group.updateMatrixWorld(true);
  }

  // Match the previous figure's readiness contract: completion always resolves,
  // including an explicit failure, so the rest of the portfolio can still open.
  const ready = new Promise((resolve) => {
    let finished = false;
    const complete = (error) => {
      if (finished) return;
      finished = true;
      clearTimeout(timeout);
      if (error) reportFailure(error);
      resolve(state);
    };
    const timeout = setTimeout(() => {
      complete(new Error('Character loading timed out.'));
    }, 30000);
    try {
      const loader = new GLTFLoader();
      const decoder = THREE.MeshoptDecoder || THREE.decoder;
      if (decoder && loader.setMeshoptDecoder) loader.setMeshoptDecoder(decoder);
      loader.load(url, (gltf) => {
        if (finished) return;
        try {
          attach(gltf);
          complete();
        } catch (error) {
          complete(error);
        }
      }, undefined, complete);
    } catch (error) {
      complete(error);
    }
  });

  return {
    group,
    root,
    uniforms,
    ready,
    state,
    poses: {},
    update({ t = 0, dt = 0, awake = 0, fly = 0 } = {}) {
      if (!state.ready) return;
      const time = Number.isFinite(t) ? t : 0;
      const delta = Number.isFinite(dt) ? Math.min(Math.max(dt, 0), 0.1) : 0;
      const flight = Number.isFinite(fly) ? Math.min(Math.max(fly, 0), 1) : 0;
      const waking = Number.isFinite(awake) ? Math.min(Math.max(awake, 0), 1) : 0;
      mixer?.update(delta);
      if (!mixer) updateRig(time, flight, waking);
      pose.position.y = Math.sin(time * 1.5) * (0.025 + waking * 0.01) * (1 - flight * 0.6);
      pose.rotation.y = Math.sin(time * 0.55) * 0.045 * (1 - flight);
      pose.rotation.z = Math.sin(time * 0.8) * 0.018 * (1 - flight * 0.7);
    },
    eyesWorld(target = new Vector3()) {
      group.updateWorldMatrix(true, true);
      return state.head ? state.head.getWorldPosition(target) : group.getWorldPosition(target);
    },
    bonePoints(targetObject) {
      if (!state.ready) return [];
      targetObject.updateWorldMatrix(true, true);
      pose.updateWorldMatrix(true, false);
      // The existing egg and charge effects need spatial landmarks, not an
      // exact humanoid skeleton. Eight corners also support unrigged models.
      return boundsPoints.map((corner) => {
        const point = pose.localToWorld(corner.clone());
        return targetObject.worldToLocal(point);
      });
    },
  };
}
