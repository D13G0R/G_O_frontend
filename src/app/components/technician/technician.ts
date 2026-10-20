import { Component } from '@angular/core';
import { TechnicianService } from './technician.service';

@Component({
  selector: 'app-technician',
  imports: [],
  templateUrl: './technician.html',
  styleUrl: './technician.css',
})
export class Technician {


  constructor(private technicianService: TechnicianService ) {
    this.technicianService = technicianService;
  }

}
