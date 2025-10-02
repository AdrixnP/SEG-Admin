import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from '../services/api.service';

@Component({
  selector: 'app-infoclassroom',
  templateUrl: './infoclassroom.component.html',
  styleUrls: ['./infoclassroom.component.css']
})
export class InfoclassroomComponent implements OnInit {
  classroomId: number = 0;
  classroomInfo: any;
  lessons: any[] = [];
  filteredLessons: any[] = [];
  reservations: any[] = [];
  selectedLessonId: number | null = null;
  loading: boolean = false;
  errorMessage: string = '';

  constructor(private route: ActivatedRoute, private apiService: ApiService) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const id = +params['id'];
      if (id) {
        this.classroomId = id;
        this.loadClassroomInfo(this.classroomId);
        this.loadLessons();
        this.loadReservations();
      } else {
        console.error('El ID del aula no es válido');
      }
    });
  }

  loadClassroomInfo(classroomId: number): void {
    this.apiService.getClassroomById(classroomId.toString()).subscribe(
      (response: any) => {
        this.classroomInfo = response;
      },
      (error: any) => {
        console.error('Error al obtener la información del salón:', error);
      }
    );
  }

  loadLessons(): void {
    this.loading = true;
    this.apiService.getAllLessons().subscribe({
      next: (lessons) => {
        this.lessons = lessons.filter(lesson => lesson.subjectLesson !== null && lesson.subjectLesson !== undefined);
        this.filteredLessons = this.lessons.filter(lesson =>
          lesson.classroomLesson && lesson.classroomLesson.name === this.classroomInfo?.name
        );
        this.loading = false;
      },
      error: (err) => {
        console.error('Error al obtener las lecciones', err);
        this.errorMessage = 'Error al cargar las lecciones';
        this.loading = false;
      }
    });
  }

  loadReservations(): void {
    this.loading = true;
    this.apiService.getAllReservationsWithUsers().subscribe({
      next: (reservations) => {
        this.reservations = reservations.filter(reservation =>
          reservation.classroomReservation?.name === this.classroomInfo?.name
        );
        this.loading = false;
      },
      error: (err) => {
        console.error('Error al obtener las reservas', err);
        this.errorMessage = 'Error al cargar las reservas';
        this.loading = false;
      }
    });
  }

  assignClassroomToLesson(lessonId: number): void {
    if (lessonId && this.classroomId) {
      this.apiService.assignClassroomToLesson(lessonId, this.classroomId).subscribe(
        (response: any) => {
          console.log('Aula asignada correctamente:', response);
          this.loadLessons();
        },
        (error: any) => {
          console.error('Error al asignar el aula:', error);
        }
      );
    } else {
      console.error('ID de lección o aula no válido');
    }
  }

  removeClassroomFromLesson(lessonId: number): void {
    if (lessonId && this.classroomId) {
      this.apiService.deleteClassroomFromLesson(lessonId.toString()).subscribe(
        (response: any) => {
          console.log('Aula eliminado correctamente:', response);
          this.loadLessons();
        },
        (error: any) => {
          console.error('Error al eliminar el aula:', error);
        }
      );
    }
  }
}
