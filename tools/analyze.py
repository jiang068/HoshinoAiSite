"""Read original OBJ geometry and record connected-component bounds (Blender Z up)."""
import bpy, bmesh, json
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT.parent / '推しの子 - アイ _ Oshino Ko - Hoshino Ai'
bpy.ops.wm.read_factory_settings(use_empty=True)
for path in sorted(SOURCE.glob('*.obj')):
    bpy.ops.wm.obj_import(filepath=str(path), forward_axis='NEGATIVE_Z', up_axis='Y')
groups = {}
for obj in list(bpy.context.scene.objects):
    mat = obj.data.materials[0]
    tex = next(n.image for n in mat.node_tree.nodes if n.type=='TEX_IMAGE' and n.image)
    groups.setdefault(Path(tex.filepath).name, []).append(obj)
result=[]
for key, objects in groups.items():
    bpy.ops.object.select_all(action='DESELECT')
    for obj in objects: obj.select_set(True)
    bpy.context.view_layer.objects.active = objects[0]
    bpy.ops.object.join()
    obj = bpy.context.object
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    bm=bmesh.new();bm.from_mesh(obj.data)
    bmesh.ops.remove_doubles(bm,verts=list(bm.verts),dist=1e-6)
    bm.verts.ensure_lookup_table();bm.verts.index_update()
    seen=set();components=[]
    for v in bm.verts:
        if v.index in seen:continue
        stack=[v];seen.add(v.index);verts=[];faces=set()
        while stack:
            current=stack.pop();verts.append(current);faces.update(current.link_faces)
            for edge in current.link_edges:
                other=edge.other_vert(current)
                if other.index not in seen:seen.add(other.index);stack.append(other)
        if not faces:continue
        lo=[min(v.co[i] for v in verts) for i in range(3)]
        hi=[max(v.co[i] for v in verts) for i in range(3)]
        components.append({'vertices':len(verts),'faces':len(faces),'min':[round(x,4) for x in lo],'max':[round(x,4) for x in hi]})
    result.append({'texture':key,'components':sorted(components,key=lambda x:-x['faces'])})
    bm.free()
(ROOT/'.cache/components.json').write_text(json.dumps(result,indent=2),encoding='utf-8')
print([(g['texture'],len(g['components'])) for g in result],flush=True)
