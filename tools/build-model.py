"""Original OBJ -> semantic groups -> selective decimation -> embedded Draco GLB.

Run using convert.ps1. Classification rules are asset-specific, not a general
AI segmentation algorithm. Blender coordinates are (OBJ x, -OBJ z, OBJ y).
"""
import bpy, bmesh, json, sys, hashlib
from mathutils.kdtree import KDTree
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
args = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
SOURCE = Path(args[0]).resolve() if args else ROOT.parent / '推しの子 - アイ _ Oshino Ko - Hoshino Ai'
RATIOS = {'character': 1.0, 'stage': 1.0, 'rig': .35, 'confetti': .6,
          'props': .18, 'effects': .3, 'venue': .4}
OUT = ROOT / 'assets'
OUT.mkdir(exist_ok=True)
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.context.preferences.filepaths.temporary_directory = str(ROOT / '.cache/temp')
files = sorted(SOURCE.glob('*.obj'))
if len(files) != 21: raise RuntimeError('Expected 21 OBJ files from the specified original model')
report = {'source_url':'https://sketchfab.com/models/20103e3eccd8433fbc7ebf7bd193143f/',
          'source_directory':SOURCE.name, 'blender':bpy.app.version_string,
          'ratios':RATIOS, 'groups':{}, 'inputs':[]}
for path in sorted(SOURCE.iterdir()):
    if path.suffix.lower() not in ('.obj','.mtl','.png'): continue
    report['inputs'].append({'name':path.name,'bytes':path.stat().st_size,
                            'sha256':hashlib.sha256(path.read_bytes()).hexdigest()})
for path in files:
    print('IMPORT',path.name,flush=True)
    bpy.ops.wm.obj_import(filepath=str(path), forward_axis='NEGATIVE_Z', up_axis='Y')
report['imported_triangles'] = sum(len(p.vertices)-2 for o in bpy.context.scene.objects for p in o.data.polygons)
texture_groups = {}
for obj in list(bpy.context.scene.objects):
    mat = obj.data.materials[0]
    image = next(n.image for n in mat.node_tree.nodes if n.type=='TEX_IMAGE' and n.image)
    texture_groups.setdefault(Path(image.filepath).name, []).append(obj)

def character_bounds(lo,hi):
    return (lo[0] > -.45 and hi[0] < .45 and lo[1] > -.95 and hi[1] < .45
            and lo[2] > 2.06 and hi[2] < 3.55)

def classify(texture, lo, hi, faces, verts, character_tree):
    size = [hi[i]-lo[i] for i in range(3)]
    # Whole components are assigned, never slice triangles through face/hair.
    in_character = character_bounds(lo,hi)
    if texture.startswith('T_Character'):
        if in_character and (len(faces)>1000 or (character_tree and
            min(character_tree.find(v.co)[2] for v in verts)<.025)): return 'character'
        if max(size) < .42 and len(faces) <= 160: return 'confetti'
        return 'props'
    if texture.startswith('T_Alpha'): return 'effects'
    if texture.startswith('UV01'): return 'stage'
    if max(size) > 15: return 'venue'
    return 'rig'

for texture, objects in texture_groups.items():
    bpy.ops.object.select_all(action='DESELECT')
    for obj in objects: obj.select_set(True)
    bpy.context.view_layer.objects.active = objects[0]
    if len(objects)>1: bpy.ops.object.join()
    obj=bpy.context.object
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    image=next(n.image for n in obj.data.materials[0].node_tree.nodes if n.type=='TEX_IMAGE' and n.image)
    # One material per atlas. Consolidating slots preserves each loop's UV.
    material=obj.data.materials[0]
    obj.data.materials.clear();obj.data.materials.append(material)
    for p in obj.data.polygons:p.material_index=0
    bm=bmesh.new();bm.from_mesh(obj.data)
    bmesh.ops.remove_doubles(bm,verts=list(bm.verts),dist=1e-6)
    bmesh.ops.dissolve_degenerate(bm,edges=list(bm.edges),dist=1e-7)
    bmesh.ops.delete(bm,geom=[v for v in bm.verts if not v.link_faces],context='VERTS')
    bm.verts.ensure_lookup_table();bm.verts.index_update();bm.faces.ensure_lookup_table();bm.faces.index_update()
    seen=set();face_groups={};component_counts={};components=[]
    for vertex in bm.verts:
        if vertex.index in seen:continue
        stack=[vertex];seen.add(vertex.index);verts=[];faces=set()
        while stack:
            current=stack.pop();verts.append(current);faces.update(current.link_faces)
            for edge in current.link_edges:
                other=edge.other_vert(current)
                if other.index not in seen:seen.add(other.index);stack.append(other)
        if not faces:continue
        lo=[min(v.co[i] for v in verts) for i in range(3)]
        hi=[max(v.co[i] for v in verts) for i in range(3)]
        components.append((lo,hi,faces,verts))
    seeds=[v for lo,hi,faces,verts in components if character_bounds(lo,hi) and len(faces)>1000 for v in verts] if texture.startswith('T_Character') else []
    tree=KDTree(len(seeds)) if seeds else None
    if tree:
        for i,v in enumerate(seeds):tree.insert(v.co,i)
        tree.balance()
        # Grow through nearby hair strands, ribbons and detached costume details.
        for _ in range(3):
            seeds=[v for lo,hi,faces,verts in components if character_bounds(lo,hi)
                   and min(tree.find(v.co)[2] for v in verts)<.025 for v in verts]
            tree=KDTree(len(seeds))
            for i,v in enumerate(seeds):tree.insert(v.co,i)
            tree.balance()
    for lo,hi,faces,verts in components:
        group=classify(texture,lo,hi,faces,verts,tree)
        face_groups.setdefault(group,set()).update(f.index for f in faces)
        component_counts[group]=component_counts.get(group,0)+1
    # Each output mesh retains original UV layers and winding / outline shells.
    for group,indices in face_groups.items():
        part=bm.copy();part.faces.ensure_lookup_table();part.faces.index_update()
        bmesh.ops.delete(part,geom=[f for f in part.faces if f.index not in indices],context='FACES')
        bmesh.ops.delete(part,geom=[v for v in part.verts if not v.link_faces],context='VERTS')
        mesh=bpy.data.meshes.new(group);part.to_mesh(mesh);part.free()
        mesh.materials.append(material)
        piece=bpy.data.objects.new(group,mesh);bpy.context.collection.objects.link(piece)
        piece['viewerGroup']=group
        before=sum(len(p.vertices)-2 for p in mesh.polygons)
        bpy.context.view_layer.objects.active=piece
        if RATIOS[group]<1:
            mod=piece.modifiers.new('Selective simplification','DECIMATE');mod.ratio=RATIOS[group]
            bpy.ops.object.modifier_apply(modifier=mod.name)
        piece.data.validate(clean_customdata=False)
        after=sum(len(p.vertices)-2 for p in piece.data.polygons)
        stats=report['groups'].setdefault(group,{'before_triangles':0,'after_triangles':0,'components':0})
        stats['before_triangles']+=before;stats['after_triangles']+=after
        stats['components']+=component_counts[group]
    bm.free();bpy.data.objects.remove(obj,do_unlink=True)
    if texture.startswith('UV02') and image.size[0]>512:image.scale(512,512)
    nodes=material.node_tree.nodes;nodes.clear()
    out=nodes.new('ShaderNodeOutputMaterial');tex=nodes.new('ShaderNodeTexImage');tex.image=image
    shader=nodes.new('ShaderNodeBsdfPrincipled')
    shader.inputs['Base Color'].default_value=(0,0,0,1)
    shader.inputs['Roughness'].default_value=1
    shader.inputs['Emission Strength'].default_value=1
    material.node_tree.links.new(tex.outputs['Color'],shader.inputs['Emission Color'])
    material.node_tree.links.new(shader.outputs[0],out.inputs['Surface'])
    if texture.startswith('T_Alpha'):
        material.node_tree.links.new(tex.outputs['Alpha'],shader.inputs['Alpha'])
        material.surface_render_method='DITHERED'
    material.use_backface_culling=True

report['clean_triangles']=sum(v['before_triangles'] for v in report['groups'].values())
report['export_triangles']=sum(v['after_triangles'] for v in report['groups'].values())
report['source_bytes']=sum(f['bytes'] for f in report['inputs'])
report['compression']={'method':'Draco','level':6,'position_bits':16,'normal_bits':12,'texcoord_bits':14}
bpy.ops.export_scene.gltf(filepath=str(OUT/'hoshino.glb'),export_format='GLB',export_extras=True,
    export_draco_mesh_compression_enable=True,export_draco_mesh_compression_level=6,
    export_draco_position_quantization=16,export_draco_normal_quantization=12,export_draco_texcoord_quantization=14)
report['glb_bytes']=(OUT/'hoshino.glb').stat().st_size
report['saved_percent']=round(100*(1-report['glb_bytes']/report['source_bytes']),2)
(OUT/'optimization-report.json').write_text(json.dumps(report,indent=2,ensure_ascii=False),encoding='utf-8')
print(json.dumps({k:v for k,v in report.items() if k!='inputs'},ensure_ascii=False),flush=True)
