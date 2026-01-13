import sys

filename = "packages/common/test/Task.test.ts"
with open(filename, "r") as f:
    lines = f.readlines()

output = []
in_conflict = False
in_head = False
in_theirs = False
head_lines = []
theirs_lines = []
conflict_start_line = 0

for i, line in enumerate(lines):
    if line.startswith("<<<<<<< HEAD"):
        in_conflict = True
        in_head = True
        head_lines = []
        theirs_lines = []
        conflict_start_line = len(output) # track logical line number in output? no, source line
        conflict_start_line_src = i
        continue
    
    if line.startswith("======="):
        in_head = False
        in_theirs = True
        continue
    
    if line.startswith(">>>>>>>"):
        in_conflict = False
        in_head = False
        in_theirs = False
        
        # logical decision: if conflict started early (imports), keep head.
        if conflict_start_line_src < 100:
            output.extend(head_lines)
            print(f"Resolved conflict at line {conflict_start_line_src}: KEPT HEAD (Imports)")
        else:
            output.extend(theirs_lines)
            print(f"Resolved conflict at line {conflict_start_line_src}: KEPT THEIRS (Body)")
        continue

    if in_conflict:
        if in_head:
            head_lines.append(line)
        if in_theirs:
            theirs_lines.append(line)
    else:
        output.append(line)

with open(filename, "w") as f:
    f.writelines(output)
