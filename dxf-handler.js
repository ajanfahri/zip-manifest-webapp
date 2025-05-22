(function(global){
  function distance(a, b){
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    return Math.hypot(dx, dy);
  }

  class DxfViewer {
    constructor(canvas){
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.entities = [];
      this.scale = 1;
      this.offsetX = 0;
      this.offsetY = 0;
      this.isDragging = false;
      this.lastX = 0;
      this.lastY = 0;
      this._bindEvents();
    }

    _bindEvents(){
      this.canvas.addEventListener('wheel', e => this._onWheel(e));
      this.canvas.addEventListener('mousedown', e => this._onDown(e));
      window.addEventListener('mousemove', e => this._onMove(e));
      window.addEventListener('mouseup', () => this._onUp());
    }

    load(file, callback){
      const reader = new FileReader();
      reader.onload = () => {
        const text = reader.result;
        const parsed = this._parse(text);
        this.entities = parsed.entities || [];
        this._resetView();
        this.draw();
        if(callback){
          callback(this._computeMetrics());
        }
      };
      reader.readAsText(file);
    }

    _parse(text){
      const parser = new window.DxfParser();
      return parser.parseSync(text);
    }

    _resetView(){
      const box = this._boundingBox();
      if(!box) return;
      const width = box.maxX - box.minX;
      const height = box.maxY - box.minY;
      this.scale = Math.min(this.canvas.width / width, this.canvas.height / height) * 0.9;
      const cx = (box.minX + box.maxX) / 2;
      const cy = (box.minY + box.maxY) / 2;
      this.offsetX = this.canvas.width / 2 - cx * this.scale;
      this.offsetY = this.canvas.height / 2 + cy * this.scale;
    }

    _boundingBox(){
      if(!this.entities.length) return null;
      let minX=Infinity, minY=Infinity, maxX=-Infinity, maxY=-Infinity;
      const expand = (x,y) => {
        if(x<minX) minX=x;
        if(y<minY) minY=y;
        if(x>maxX) maxX=x;
        if(y>maxY) maxY=y;
      };
      this.entities.forEach(e => {
        switch(e.type){
          case 'LINE':
            expand(e.vertices[0].x, e.vertices[0].y);
            expand(e.vertices[1].x, e.vertices[1].y);
            break;
          case 'LWPOLYLINE':
          case 'POLYLINE':
            e.vertices.forEach(v => expand(v.x, v.y));
            break;
          case 'CIRCLE':
          case 'ARC':
            expand(e.center.x - e.radius, e.center.y - e.radius);
            expand(e.center.x + e.radius, e.center.y + e.radius);
            break;
        }
      });
      return {minX, minY, maxX, maxY};
    }

    _computeMetrics(){
      let length = 0;
      let count = 0;
      this.entities.forEach(e => {
        if(e.type === 'LINE'){
          length += distance(e.vertices[0], e.vertices[1]);
          count++;
        } else if(e.type === 'LWPOLYLINE' || e.type === 'POLYLINE'){
          const verts = e.vertices;
          for(let i=0;i<verts.length-1;i++){
            length += distance(verts[i], verts[i+1]);
            count++;
          }
          if(e.shape || e.closed){
            length += distance(verts[verts.length-1], verts[0]);
            count++;
          }
        } else if(e.type === 'ARC'){
          const angle = Math.abs(e.endAngle - e.startAngle) * Math.PI/180;
          length += e.radius * angle;
          count++;
        } else if(e.type === 'CIRCLE'){
          length += 2*Math.PI*e.radius;
          count++;
        }
      });
      return {cutLength: length, explodeCount: count};
    }

    _onWheel(e){
      e.preventDefault();
      const scaleFactor = e.deltaY > 0 ? 0.9 : 1.1;
      const mx = e.offsetX;
      const my = e.offsetY;
      const wx = (mx - this.offsetX) / this.scale;
      const wy = (my - this.offsetY) / -this.scale;
      this.scale *= scaleFactor;
      this.offsetX = mx - wx * this.scale;
      this.offsetY = my + wy * this.scale;
      this.draw();
    }

    _onDown(e){
      this.isDragging = true;
      this.lastX = e.clientX;
      this.lastY = e.clientY;
      this.canvas.style.cursor = 'grabbing';
    }

    _onMove(e){
      if(!this.isDragging) return;
      const dx = e.clientX - this.lastX;
      const dy = e.clientY - this.lastY;
      this.lastX = e.clientX;
      this.lastY = e.clientY;
      this.offsetX += dx;
      this.offsetY += dy;
      this.draw();
    }

    _onUp(){
      this.isDragging = false;
      this.canvas.style.cursor = 'grab';
    }

    draw(){
      const ctx = this.ctx;
      ctx.setTransform(1,0,0,1,0,0);
      ctx.clearRect(0,0,this.canvas.width,this.canvas.height);
      ctx.lineWidth = 1;
      ctx.strokeStyle = '#000';
      ctx.setTransform(this.scale,0,0,-this.scale,this.offsetX,this.offsetY);
      this.entities.forEach(e => {
        ctx.beginPath();
        if(e.type === 'LINE'){
          ctx.moveTo(e.vertices[0].x, e.vertices[0].y);
          ctx.lineTo(e.vertices[1].x, e.vertices[1].y);
        } else if(e.type === 'LWPOLYLINE' || e.type === 'POLYLINE'){
          const v = e.vertices;
          if(v.length){
            ctx.moveTo(v[0].x, v[0].y);
            for(let i=1;i<v.length;i++) ctx.lineTo(v[i].x, v[i].y);
            if(e.shape || e.closed) ctx.lineTo(v[0].x, v[0].y);
          }
        } else if(e.type === 'ARC'){
          const start = e.startAngle * Math.PI/180;
          const end = e.endAngle * Math.PI/180;
          ctx.arc(e.center.x, e.center.y, e.radius, start, end);
        } else if(e.type === 'CIRCLE'){
          ctx.arc(e.center.x, e.center.y, e.radius, 0, 2*Math.PI);
        }
        ctx.stroke();
      });
    }
  }

  global.DxfHandler = { DxfViewer };
})(this);
