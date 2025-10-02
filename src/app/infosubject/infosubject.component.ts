import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../services/api.service';

@Component({
  selector: 'app-infosubject',
  templateUrl: './infosubject.component.html',
})
export class InfosubjectComponent implements OnInit {
  subjectId: string = '';
  subjectNrc: string = '';
  subjectInfo: any = null;
  lessons: any[] = [];
  newLesson: any = {
    dayWeek: '',
    startTime: '',
    endTime: ''
  };
  selectedLesson: any = null;
  isEditMode: boolean = false;
  sortColumn: string = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  constructor(
    private route: ActivatedRoute,
    private apiService: ApiService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.subjectId = this.route.snapshot.paramMap.get('id') || '';
    if (this.subjectId) {
      this.loadLessons();
    }
  }

  convertTo24HourFormat(time: string): string {
    const [hour, minute] = time.split(':');
    const period = time.slice(-2);
    let hours24 = parseInt(hour, 10);

    if (period === 'AM') {
      if (hours24 === 12) {
        hours24 = 0;
      }
    } else if (period === 'PM') {
      if (hours24 !== 12) {
        hours24 += 12;
      }
    }

    return `${hours24.toString().padStart(2, '0')}:${minute.padStart(2, '0')}:00`;
  }

  loadLessons(): void {
    this.apiService.getAllLessons().subscribe(
      (data) => {
        this.apiService.getSubjectById(this.subjectId).subscribe(
          (subjectData) => {
            this.subjectInfo = subjectData;
            this.subjectNrc = subjectData.nrc;
            this.lessons = data.filter((lesson: any) => lesson.subjectLesson?.nrc === this.subjectNrc);
            this.sortLessons();
          }
        );
      }
    );
  }

  sortLessons(): void {
    if (!this.sortColumn) return;
    this.lessons.sort((a, b) => {
      const valueA = a[this.sortColumn];
      const valueB = b[this.sortColumn];
      if (valueA < valueB) return this.sortDirection === 'asc' ? -1 : 1;
      if (valueA > valueB) return this.sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }

  onSort(column: string): void {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    this.sortLessons();
  }

  onCreateLesson(): void {
    const lessonData = {
      dayWeek: this.newLesson.dayWeek,
      startTime: this.convertTo24HourFormat(this.newLesson.startTime),
      endTime: this.convertTo24HourFormat(this.newLesson.endTime),
    };

    this.apiService.createLesson(lessonData).subscribe(
      (createdLesson) => {
        this.apiService.assignLessonToSubject(createdLesson.id, this.subjectId).subscribe(
          () => {
            this.loadLessons();
            this.resetForm();
          }
        );
      }
    );
  }

  onUpdateLesson(): void {
    const lessonData = {
      dayWeek: this.newLesson.dayWeek,
      startTime: this.convertTo24HourFormat(this.newLesson.startTime),
      endTime: this.convertTo24HourFormat(this.newLesson.endTime),
    };

    this.apiService.updateLesson(this.selectedLesson.id, lessonData).subscribe(
      () => {
        this.loadLessons();
        this.resetForm();
      }
    );
  }

  onSelectLesson(lesson: any): void {
    this.selectedLesson = { ...lesson };
    this.newLesson = {
      dayWeek: lesson.dayWeek,
      startTime: lesson.startTime,
      endTime: lesson.endTime
    };
    this.isEditMode = true;
  }

  resetForm(): void {
    this.newLesson = { dayWeek: '', startTime: '', endTime: '' };
    this.selectedLesson = null;
    this.isEditMode = false;
  }

  onDeleteLesson(lessonId: any): void {
    const lessonIdStr = lessonId.toString();
    const lessonIdCleaned = lessonIdStr.split(':')[0];

    if (confirm('¿Estás seguro de que deseas eliminar esta lección?')) {
      this.apiService.getUsersByLesson(lessonIdCleaned).subscribe(
        (response: any) => {
          response.userSetHash.forEach((user: any) => {
            this.deleteUserLessonRelationship(user.id, lessonIdCleaned);
          });

          if (this.selectedLesson?.classroomLesson !== null) {
            this.deleteClassroomFromLesson(lessonIdCleaned);
          }

          if (this.selectedLesson?.subjectLesson !== null) {
            this.deleteSubjectFromLesson(lessonIdCleaned);
          }

          this.deleteLesson(lessonIdCleaned);
        }
      );
    }
  }

  deleteUserLessonRelationship(userId: string, lessonId: string): void {
    this.apiService.deleteUserLesson(userId, lessonId).subscribe();
  }

  deleteClassroomFromLesson(lessonId: string): void {
    this.apiService.deleteClassroomFromLesson(lessonId).subscribe();
  }

  deleteSubjectFromLesson(lessonId: string): void {
    this.apiService.deleteSubjectFromLesson(lessonId).subscribe();
  }

  deleteLesson(lessonId: string): void {
    this.apiService.deleteLesson(lessonId).subscribe(
      () => {
        this.loadLessons();
      }
    );
  }
}
