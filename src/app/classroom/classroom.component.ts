import { Component, OnInit } from '@angular/core';
import { ApiService } from '../services/api.service';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-classroom',
  templateUrl: './classroom.component.html'
})
export class ClassroomComponent implements OnInit {
  classrooms: any[] = [];
  sortColumn = '';
  sortDirection = 'asc';
  formClassroom: any = {
    id: 0,
    name: '',
    capacity: 0
  };

  selectedClassroom: any = null;
  classroomInfo: any = null;
  classroomId: string | null = null;

  constructor(
    private apiService: ApiService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.getAllClassrooms();
    this.classroomId = this.route.snapshot.paramMap.get('id');
    if (this.classroomId) {
      this.apiService.getClassroomById(this.classroomId).subscribe(
        (response) => {
          this.classroomInfo = response;
        },
        (error) => {
          console.error('Error fetching classroom info:', error);
        }
      );
    }
  }

  getAllClassrooms() {
    this.apiService.getAllClassrooms().subscribe(
      (data: any[]) => {
        this.classrooms = data;
      },
      (error) => {
        console.error('Error fetching classrooms:', error);
      }
    );
  }

  onCreate() {
    if (this.formClassroom.name && this.formClassroom.capacity) {
      this.apiService.createClassroom(this.formClassroom).subscribe(
        (response) => {
          console.log('Classroom created successfully:', response);
          this.getAllClassrooms();
          this.router.navigate(['/classroom']);
        },
        (error) => {
          console.error('Error creating classroom:', error);
        }
      );
    } else {
      console.warn('Formulario incompleto');
    }
  }

  onEdit(classroom: any) {
    this.selectedClassroom = { ...classroom };
    this.formClassroom = { ...classroom };
  }

  onUpdate(classroom: any) {
    if (classroom.name && classroom.capacity) {
      this.apiService.updateClassroom(classroom.id, classroom).subscribe(
        (response) => {
          console.log('Classroom updated:', response);
          this.getAllClassrooms();
          this.resetForm();
        },
        (error) => {
          console.error('Error updating classroom:', error);
        }
      );
    } else {
      console.warn('Formulario incompleto');
    }
  }

  onDelete(classroomId: string) {
    if (confirm('¿Estás seguro de que deseas eliminar este salón?')) {
      this.apiService.deleteClassroom(classroomId).subscribe(
        (response) => {
          console.log('Classroom deleted successfully:', response);
          alert('Classroom deleted successfully!');
          this.getAllClassrooms();
        },
        (error) => {
          console.error('Error deleting classroom:', error);
          alert('Failed to delete classroom.');
        }
      );
    }
  }

  resetForm() {
    this.formClassroom = {
      id: 0,
      name: '',
      capacity: 0
    };
    this.selectedClassroom = null;
  }

  sortData() {
    if (this.sortColumn) {
      this.classrooms.sort((a, b) => {
        if (a[this.sortColumn] < b[this.sortColumn]) {
          return this.sortDirection === 'asc' ? -1 : 1;
        } else if (a[this.sortColumn] > b[this.sortColumn]) {
          return this.sortDirection === 'asc' ? 1 : -1;
        } else {
          return 0;
        }
      });
    }
  }

  onSort(column: string) {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    this.sortData();
  }
}
