Ext.grid.RowWithCellSelectionModel = function(config){
    Ext.apply(this, config);

    this.selection = null;

    this.addEvents(
        /**
	     * @event beforecellselect
	     * Fires before a cell is selected.
	     * @param {SelectionModel} this
	     * @param {Number} rowIndex The selected row index
	     * @param {Number} colIndex The selected cell index
	     */
	    "beforecellselect",
        /**
	     * @event cellselect
	     * Fires when a cell is selected.
	     * @param {SelectionModel} this
	     * @param {Number} rowIndex The selected row index
	     * @param {Number} colIndex The selected cell index
	     */
	    "cellselect",
        /**
	     * @event selectionchange
	     * Fires when the active selection changes.
	     * @param {SelectionModel} this
	     * @param {Object} selection null for no selection or an object (o) with two properties
	        <ul>
	        <li>o.record: the record object for the row the selection is in</li>
	        <li>o.cell: An array of [rowIndex, columnIndex]</li>
	        </ul>
	     */
	    "selectionchange",
	    
	    "cellup",
	    
	    "celldown",
	    
	    "cellleft",
	    
	    "cellright"
	    
    );

    Ext.grid.RowWithCellSelectionModel.superclass.constructor.call(this);
};


Ext.extend(Ext.grid.RowWithCellSelectionModel, Ext.grid.RowSelectionModel, {
  
  initEvents : function(){
      if(!this.grid.enableDragDrop && !this.grid.enableDrag){
          this.grid.on("rowmousedown", this.handleMouseDown, this);
      }else{ // allow click to work like normal
          this.grid.on("rowclick", function(grid, rowIndex, e) {
              if(e.button === 0 && !e.shiftKey && !e.ctrlKey) {
                  this.clearSelection();
                  this.selectRow(rowIndex, false);
                  grid.view.focusRow(rowIndex);
              }
          }, this);
      }
      
      this.grid.getGridEl().on(Ext.isIE || Ext.isSafari3 ? "keydown" : "keypress", this.handleKeyDown, this);
      
      var view = this.grid.view;
      view.on("rowupdated", this.onRowUpdated, this);
      if(this.grid.isEditor){
          this.grid.on("beforeedit", this.beforeEdit,  this);
      }
  },
  
	//private
  beforeEdit : function(e){
    this.deselectRow(e.row);
    this.select(e.row, e.column, false, true, e.record);
  },
  

	//private
  onRowUpdated : function(v, index, r){
      if(this.selection && this.selection.record == r){
          v.onCellSelect(index, this.selection.cell[1]);
      }
  },
  
  handleMouseDown : function(g, rowIndex, e){
    this.clearSelection();
    Ext.grid.RowWithCellSelectionModel.superclass.handleMouseDown.call(this, g, rowIndex, e);
  },
  
  clearSelection : function(preventNotify){
      var s = this.selection;
      if(s){
          if(preventNotify !== true){
              this.grid.view.onCellDeselect(s.cell[0], s.cell[1]);
          }
          this.selection = null;
          this.fireEvent("selectionchange", this, null);
      }
  },
  
  hasSelection : function(){
      return this.selection ? true : false;
  },
  
  hasSelections : function(){
      return this.selections.length > 0;
  },
  
  select : function(rowIndex, colIndex, preventViewNotify, preventFocus, /*internal*/ r){
      if(this.fireEvent("beforecellselect", this, rowIndex, colIndex) !== false){
          this.clearSelection();
          r = r || this.grid.store.getAt(rowIndex);
          this.selection = {
              record : r,
              cell : [rowIndex, colIndex]
          };
          if(!preventViewNotify){
              var v = this.grid.getView();
              v.onCellSelect(rowIndex, colIndex);
              if(preventFocus !== true){
                  v.focusCell(rowIndex, colIndex);
              }
          }
          this.fireEvent("cellselect", this, rowIndex, colIndex);
          this.fireEvent("selectionchange", this, this.selection);
      }
  },
  
  isSelectable : function(rowIndex, colIndex, cm){
      return !cm.isHidden(colIndex);
  },
  
  handleKeyDown : function(e){
      
      if(!e.isNavKeyPress()){
          return;
      }
      var g = this.grid, s = this.selection;
      
      var sm = this;
      var walk = function(row, col, step){
          return g.walkCells(row, col, step, sm.isSelectable,  sm);
      };
      
      var k = e.getKey();
      
      if (s) {
        var r = s.cell[0], c = s.cell[1];
        var newCell;
      
        switch(k){
             case e.TAB:
                 if(e.shiftKey){
                     newCell = walk(r, c-1, -1);
                 }else{
                     newCell = walk(r, c+1, 1);
                 }
             break;
             case e.DOWN:
                 this.fireEvent("celldown", this, r, c)
                 newCell = walk(r+1, c, 1);
             break;
             case e.UP:
                 this.fireEvent("cellup", this, r, c)
                 newCell = walk(r-1, c, -1);
             break;
             case e.RIGHT:
                 this.fireEvent("cellright", this, r, c)
                 newCell = walk(r, c+1, 1);
             break;
             case e.LEFT:
                 this.fireEvent("cellleft", this, r, c)
                 newCell = walk(r, c-1, -1);
             break;
             case e.ENTER:
                 if(g.isEditor && !g.editing){
                    g.startEditing(r, c);
                    e.stopEvent();
                    return;
                }
             break;
        };
        if(newCell){
            this.select(newCell[0], newCell[1]);
            e.stopEvent();
        }
      } else {
        switch(k){
             case e.DOWN:
              this.onRowDown(e);
              e.stopEvent();
              break;
             case e.UP:
              this.onRowUp(e);
              e.stopEvent();
              break;
        };
      }
  },
  
  onRowDown : function(e){
    if(!e.shiftKey){
        this.selectNext(e.shiftKey);
    }else if(this.last !== false && this.lastActive !== false){
        var last = this.last;
        this.selectRange(this.last,  this.lastActive+1);
        this.grid.getView().focusRow(this.lastActive);
        if(last !== false){
            this.last = last;
        }
    }else{
        this.selectFirstRow();
    }
  },
  
  onRowUp : function(e){
    if(!e.shiftKey){
        this.selectPrevious(e.shiftKey);
    }else if(this.last !== false && this.lastActive !== false){
        var last = this.last;
        this.selectRange(this.last,  this.lastActive-1);
        this.grid.getView().focusRow(this.lastActive);
        if(last !== false){
            this.last = last;
        }
    }else{
        this.selectFirstRow();
    }
  },
  
  // private
  onEditorKey : function(field, e){
      var k = e.getKey(), newCell, g = this.grid, ed = g.activeEditor;
      var shift = e.shiftKey;
      if(k == e.TAB){
          e.stopEvent();
          ed.completeEdit();
          if(shift || k == e.LEFT){
              newCell = g.walkCells(ed.row, ed.col-1, -1, this.acceptsNav, this);
          }else{
              newCell = g.walkCells(ed.row, ed.col+1, 1, this.acceptsNav, this);
          }
      }else if(k == e.ENTER){
        e.stopEvent();
        ed.completeEdit();
      }else if(k == e.ESC){
          ed.cancelEdit();
      }
      if(newCell){
          g.startEditing(newCell[0], newCell[1]);
      }
  }
  
});