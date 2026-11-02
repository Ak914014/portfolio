"""Prepare the creator's Mickey Mouse Blender asset for the portfolio.

Run with Blender --background --disable-autoexec <source.blend> --python <script>.
"""
import bpy
import json
import sys
from pathlib import Path
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[2]
OUTPUT = ROOT / 'website/public/models/mickey-mouse.glb'
PREVIEW = ROOT / 'evidence/mickey-model-preview.png'


def inspect_scene():
    print('MICKEY_SCENE', json.dumps({
        'objects': [
            {
                'name': obj.name,
                'type': obj.type,
                'parent': obj.parent.name if obj.parent else None,
                'hide_render': obj.hide_render,
                'hide_viewport': obj.hide_viewport,
                'vertices': len(obj.data.vertices) if obj.type == 'MESH' else None,
                'location': list(obj.location),
                'rotation': list(obj.rotation_euler),
                'scale': list(obj.scale),
                'dimensions': list(obj.dimensions),
                'uv_layers': [u.name for u in obj.data.uv_layers] if obj.type == 'MESH' else [],
                'color_attributes': [a.name for a in obj.data.color_attributes] if obj.type == 'MESH' else [],
                'materials': [slot.material.name if slot.material else None for slot in obj.material_slots],
                'modifiers': [{'name': m.name, 'type': m.type,
                               'levels': getattr(m, 'levels', None),
                               'render_levels': getattr(m, 'render_levels', None)} for m in obj.modifiers],
            } for obj in bpy.data.objects if not obj.name.startswith('WGT')
        ],
        'materials': [
            {'name': mat.name, 'diffuse': list(mat.diffuse_color),
             'nodes': [{'name': n.name, 'type': n.type, 'image': n.image.name if n.type == 'TEX_IMAGE' and n.image else None} for n in mat.node_tree.nodes] if mat.node_tree else [],
             'shader_links': [{'from': l.from_node.name, 'from_socket': l.from_socket.name, 'to': l.to_node.name, 'to_socket': l.to_socket.name} for l in mat.node_tree.links if l.to_node.type in ['BSDF_PRINCIPLED', 'OUTPUT_MATERIAL']] if mat.node_tree else []}
            for mat in bpy.data.materials
        ],
        'armatures': [
            {'name': a.name, 'deform_bones': [b.name for b in a.bones if b.use_deform]}
            for a in bpy.data.armatures
        ],
        'images': [{'name': i.name, 'size': list(i.size), 'packed': bool(i.packed_file), 'filepath': i.filepath} for i in bpy.data.images],
    }))


def make_web_material(name, image_name, roughness):
    """Use the creator's packed baked color texture, without custom shaders."""
    material = bpy.data.materials.new(name)
    material.use_nodes = True
    nodes = material.node_tree.nodes
    shader = nodes.get('Principled BSDF')
    shader.inputs['Roughness'].default_value = roughness
    shader.inputs['Metallic'].default_value = 0
    tex = nodes.new('ShaderNodeTexImage')
    tex.image = bpy.data.images[image_name]
    tex.image.colorspace_settings.name = 'sRGB'
    material.node_tree.links.new(tex.outputs['Color'], shader.inputs['Base Color'])
    return material


def point_at(obj, target):
    obj.rotation_euler = (Vector(target) - obj.location).to_track_quat('-Z', 'Y').to_euler()


def convert():
    if bpy.context.object and bpy.context.object.mode != 'OBJECT':
        bpy.ops.object.mode_set(mode='OBJECT')
    body = bpy.data.objects['body']
    eyes = [bpy.data.objects['eye_L'], bpy.data.objects['eye_R']]
    rig = bpy.data.objects['RIG-Mickey_Mouse']
    body.data.materials.clear()
    body.data.materials.append(make_web_material('Mickey body', 'Mickey_Mouse_Body_BAKED', .75))
    eye_material = make_web_material('Mickey eye', 'Mickey_Mouse_Eye_BAKED', .35)
    for eye in eyes:
        eye.data.materials.clear()
        eye.data.materials.append(eye_material)
        world_matrix = eye.matrix_world.copy()
        eye.parent = rig
        eye.matrix_world = world_matrix
    print('MICKEY_UVS', body.data.uv_layers.active.name,
          [(uv.name, uv.active_render) for uv in body.data.uv_layers])
    for obj in [body, *eyes]:
        for mod in obj.modifiers:
            if mod.type == 'SUBSURF':
                mod.levels = mod.render_levels = 1
        # The web rig uses deformation bones, without Blender-only facial drivers.
        obj.animation_data_clear()
    rig.animation_data_clear()
    bpy.context.scene.frame_set(1)
    bpy.ops.object.select_all(action='DESELECT')
    for obj in [body, *eyes, rig]:
        obj.hide_set(False)
        obj.select_set(True)
    bpy.context.view_layer.objects.active = body
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    bpy.ops.export_scene.gltf(
        filepath=str(OUTPUT), export_format='GLB', use_selection=True,
        export_yup=True, export_apply=True, export_skins=True,
        export_def_bones=True, export_animations=False, export_morph=False,
        export_cameras=False, export_lights=False, export_extras=False,
        export_image_format='AUTO', export_materials='EXPORT',
        export_vertex_color='NONE',
    )
    # Verify and render the exported file, rather than the Blender source scene.
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=str(OUTPUT))
    # The importer may create unrendered custom bone-display geometry.
    meshes = [o for o in bpy.context.scene.objects
              if o.type == 'MESH' and any(slot.material for slot in o.material_slots)]
    points = [o.matrix_world @ Vector(corner) for o in meshes for corner in o.bound_box]
    minimum = Vector(tuple(min(v[i] for v in points) for i in range(3)))
    maximum = Vector(tuple(max(v[i] for v in points) for i in range(3)))
    center = (minimum + maximum) / 2
    triangles = 0
    for obj in meshes:
        obj.data.calc_loop_triangles()
        triangles += len(obj.data.loop_triangles)
    metadata = {
        'bytes': OUTPUT.stat().st_size, 'triangles': triangles,
        'mesh_objects': len(meshes), 'bounds_min': list(minimum), 'bounds_max': list(maximum),
        'bounds_space': 'Blender Z-up after reimport',
        'bones': [b.name for a in bpy.data.armatures for b in a.bones],
        'source': 'https://cappyadams.itch.io/mickey-mouse',
        'creator': 'CappyAdams',
        'license': 'CC BY-NC 4.0',
        'forward_gltf': '+Z', 'up_gltf': '+Y',
    }
    (ROOT / 'evidence/mickey-model-metadata.json').write_text(
        json.dumps(metadata, indent=2), encoding='utf-8')
    print('MICKEY_EXPORT', json.dumps(metadata))
    scene = bpy.context.scene
    scene.render.engine = 'CYCLES'
    scene.cycles.samples = 24
    scene.cycles.use_denoising = True
    scene.render.resolution_x = 1000
    scene.render.resolution_y = 1000
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = 'PNG'
    scene.render.filepath = str(PREVIEW)
    scene.view_settings.view_transform = 'AgX'
    scene.world = bpy.data.worlds.new('Preview world')
    scene.world.use_nodes = True
    scene.world.node_tree.nodes['Background'].inputs['Color'].default_value = (.12, .15, .2, 1)
    scene.world.node_tree.nodes['Background'].inputs['Strength'].default_value = .4
    bpy.ops.object.camera_add(location=(center.x + 5, center.y - 15, center.z + 3))
    camera = bpy.context.object
    camera.data.type = 'ORTHO'
    camera.data.ortho_scale = max(maximum.z - minimum.z, maximum.x - minimum.x) * 1.22
    point_at(camera, center)
    scene.camera = camera
    for location, power, size in [((4, -7, 10), 1500, 7), ((-6, -3, 5), 1000, 6), ((2, 5, 9), 1800, 5)]:
        bpy.ops.object.light_add(type='AREA', location=location)
        light = bpy.context.object
        light.data.energy = power
        light.data.shape = 'DISK'
        light.data.size = size
        point_at(light, center)
    PREVIEW.parent.mkdir(parents=True, exist_ok=True)
    bpy.ops.render.render(write_still=True)


if '--inspect' in sys.argv:
    inspect_scene()
else:
    convert()
